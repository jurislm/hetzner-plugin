import { describe, expect, test } from "bun:test";
import { HetznerApiError, HetznerClient } from "./client.js";

const config = { cloudToken: "cloud-secret", unifiedToken: "unified-secret", timeoutMs: 30_000 };
const cloudOperation = { source: "cloud" as const, method: "POST", path: "/servers/{id}", parameters: [{ location: "path", name: "id" }, { location: "query", name: "label" }] };

describe("HetznerClient", () => {
  test("encodes path/query/body and selects the Cloud token", async () => {
    let request = "";
    const client = new HetznerClient(config, async (url, init) => {
      request = String(url);
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer cloud-secret");
      expect(init?.body).toBe('{"name":"api"}');
      return new Response(JSON.stringify({ id: 1 }), { headers: { "content-type": "application/json" } });
    });
    await expect(client.request(cloudOperation, { id: "a/b", label: "prod blue", body: { name: "api" } })).resolves.toEqual({
      data: { id: 1 }, status: 200, request: { method: "POST", path: "/servers/a%2Fb" },
    });
    expect(request).toBe("https://api.hetzner.cloud/v1/servers/a%2Fb?label=prod+blue");
  });

  test("uses the Unified token and preserves empty, text, and binary responses", async () => {
    const client = new HetznerClient(config, async (url) => {
      if (String(url).endsWith("/empty")) return new Response(null, { status: 204 });
      if (String(url).endsWith("/text")) return new Response("ok", { headers: { "content-type": "text/plain" } });
      return new Response(new Uint8Array([65]), { headers: { "content-type": "application/octet-stream" } });
    });
    const operation = (path: string) => ({ source: "unified" as const, method: "GET", path, parameters: [] });
    await expect(client.request(operation("/empty"), {})).resolves.toMatchObject({ data: null, status: 204 });
    await expect(client.request(operation("/text"), {})).resolves.toMatchObject({ data: "ok" });
    await expect(client.request(operation("/binary"), {})).resolves.toMatchObject({ data: { encoding: "base64", value: "QQ==" } });
  });

  test("does not retry and redacts tokens from request failures", async () => {
    let calls = 0;
    const client = new HetznerClient(config, async () => { calls++; throw new Error("cloud-secret failed"); });
    const error = await client.request(cloudOperation, { id: 1 }).catch((value) => value);
    expect(error).toBeInstanceOf(HetznerApiError);
    expect(error.message).not.toContain("cloud-secret");
    expect(calls).toBe(1);
  });

  test("requires the Unified token only for Unified operations", async () => {
    let calls = 0;
    const client = new HetznerClient({ cloudToken: "cloud-secret", timeoutMs: 30_000 }, async () => { calls++; return new Response(); });
    await expect(client.request({ source: "unified", method: "GET", path: "/storage_boxes", parameters: [] }, {})).rejects.toMatchObject({
      message: "HETZNER_API_TOKEN_UNIFIED is required for unified Storage Box operations",
    });
    expect(calls).toBe(0);
  });

  test("aborts a timed-out request without retrying", async () => {
    let calls = 0;
    let signal: AbortSignal | undefined;
    const client = new HetznerClient({ ...config, timeoutMs: 1 }, async (_url, init) => {
      calls++;
      signal = init?.signal as AbortSignal;
      await new Promise<void>((resolve) => signal?.addEventListener("abort", resolve, { once: true }));
      throw signal?.reason;
    });
    await expect(client.request(cloudOperation, { id: 1 })).rejects.toBeInstanceOf(HetznerApiError);
    expect(signal?.aborted).toBe(true);
    expect(calls).toBe(1);
  });
});

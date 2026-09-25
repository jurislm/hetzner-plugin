import { describe, expect, test } from "bun:test";
import { HetznerApiError, HetznerClient } from "./client.js";

const config = { apiToken: "single-secret", timeoutMs: 30_000 };
const cloudOperation = { source: "cloud" as const, method: "POST", path: "/servers/{id}", parameters: [{ location: "path", name: "id" }, { location: "query", name: "label" }] };

describe("HetznerClient", () => {
  test("uses the canonical token for Cloud requests", async () => {
    let request = "";
    const client = new HetznerClient(config, async (url, init) => {
      request = String(url);
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer single-secret");
      expect(init?.body).toBe('{"name":"api"}');
      return new Response(JSON.stringify({ id: 1 }), { headers: { "content-type": "application/json" } });
    });
    await expect(client.request(cloudOperation, { id: "a/b", label: "prod blue", body: { name: "api" } })).resolves.toEqual({
      data: { id: 1 }, status: 200, request: { method: "POST", path: "/servers/a%2Fb" },
    });
    expect(request).toBe("https://api.hetzner.cloud/v1/servers/a%2Fb?label=prod+blue");
  });

  test("uses the canonical token for Unified requests and preserves response formats", async () => {
    const client = new HetznerClient(config, async (url, init) => {
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer single-secret");
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
    const client = new HetznerClient(config, async () => { calls++; throw new Error("single-secret failed"); });
    const error = await client.request(cloudOperation, { id: 1 }).catch((value) => value);
    expect(error).toBeInstanceOf(HetznerApiError);
    expect(error.message).not.toContain("single-secret");
    expect(calls).toBe(1);
  });

  test("returns one-time console credentials only for the explicit console action", async () => {
    const data = {
      wss_url: "wss://console.hetzner.cloud/?token=one-time-secret",
      password: "one-time-secret",
      api_token: "unrelated-secret",
    };
    const client = new HetznerClient(config, async () => new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } }));
    const consoleResult = await client.request({ source: "cloud", method: "POST", path: "/servers/{id}/actions/request_console", parameters: [{ location: "path", name: "id" }] }, { id: 1 });
    expect(consoleResult.data).toEqual({ ...data, api_token: "[REDACTED]" });
    const listResult = await client.request({ source: "cloud", method: "GET", path: "/servers", parameters: [] }, {});
    expect(listResult.data).toEqual({ wss_url: "[REDACTED]", password: "[REDACTED]", api_token: "[REDACTED]" });
  });

  test("returns root passwords only from credential-producing server actions", async () => {
    const client = new HetznerClient(config, async () => new Response(JSON.stringify({ root_password: "one-time-secret", server: { labels: { root_password: "unrelated-secret" } } }), { headers: { "content-type": "application/json" } }));
    for (const path of ["/servers", "/servers/{id}/actions/enable_rescue", "/servers/{id}/actions/rebuild", "/servers/{id}/actions/reset_password"]) {
      const hasId = path.includes("{id}");
      const result = await client.request({ source: "cloud", method: "POST", path, parameters: hasId ? [{ location: "path", name: "id" }] : [] }, hasId ? { id: 1 } : {});
      expect(result.data).toEqual({ root_password: "one-time-secret", server: { labels: { root_password: "[REDACTED]" } } });
    }
    const listResult = await client.request({ source: "cloud", method: "GET", path: "/servers", parameters: [] }, {});
    expect(listResult.data).toEqual({ root_password: "[REDACTED]", server: { labels: { root_password: "[REDACTED]" } } });
  });

  test("preserves null when no root password was generated", async () => {
    const client = new HetznerClient(config, async () => new Response(JSON.stringify({ root_password: null }), { headers: { "content-type": "application/json" } }));
    const result = await client.request({ source: "cloud", method: "POST", path: "/servers", parameters: [] }, {});
    expect(result.data).toEqual({ root_password: null });
  });

  test("requires the canonical token for every API operation", async () => {
    let calls = 0;
    const client = new HetznerClient({ timeoutMs: 30_000 }, async () => { calls++; return new Response(); });
    await expect(client.request({ source: "unified", method: "GET", path: "/storage_boxes", parameters: [] }, {})).rejects.toMatchObject({
      message: "HETZNER_API_TOKEN is required for Hetzner API operations",
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

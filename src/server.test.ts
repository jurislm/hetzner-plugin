import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, test } from "bun:test";
import { operations } from "./generated/operations.js";
import { createServer } from "./server.js";

const config = { apiToken: "single-token", timeoutMs: 30_000 };
const emptyServers = { servers: [], meta: { pagination: { page: 1, per_page: 25, previous_page: null, next_page: null, last_page: 1, total_entries: 0 } } };

describe("generated Hetzner MCP server", () => {
  test("registers the combined official contract with safe annotations", async () => {
    const server = createServer(config, async () => new Response(JSON.stringify(emptyServers), { headers: { "content-type": "application/json" } }));
    const client = new Client({ name: "test", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const result = await client.listTools();
    expect(result.tools.length).toBeGreaterThanOrEqual(operations.length);
    expect(result.tools.some((tool) => tool.name === "hetzner_cloud_list_servers")).toBe(true);
    expect(result.tools.some((tool) => tool.name === "hetzner_unified_list_storage_boxes")).toBe(true);
    expect(result.tools.some((tool) => tool.name === "hetzner_get_storage_box_stats")).toBe(true);
    expect(result.tools.some((tool) => tool.name === "hetzner_assert_storage_box_space")).toBe(true);
    expect(result.tools.some((tool) => tool.name === "hetzner_get_server_ram")).toBe(true);
    expect(result.tools.find((tool) => tool.name === "hetzner_cloud_delete_server")?.annotations?.destructiveHint).toBe(true);
    expect(result.tools.find((tool) => tool.name === "hetzner_reset_storage_box_password")?.annotations?.destructiveHint).toBe(true);
    expect(result.tools.every((tool) => tool.annotations?.openWorldHint === false)).toBe(true);
    await client.close();
    await server.close();
  });

  test("returns a ToolEnvelope through a generated Cloud operation", async () => {
    const server = createServer(config, async () => new Response(JSON.stringify(emptyServers), { headers: { "content-type": "application/json" } }));
    const client = new Client({ name: "test", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const result = await client.callTool({ name: "hetzner_cloud_list_servers", arguments: {} });
    expect(result.structuredContent).toEqual({ data: emptyServers, status: 200, request: { method: "GET", path: "/servers" } });
    await client.close();
    await server.close();
  });

  test("omits the default folder path unless the caller supplies it", async () => {
    const urls: string[] = [];
    const server = createServer(config, async (url) => {
      urls.push(String(url));
      return new Response(JSON.stringify({ folders: ["backup"] }), { headers: { "content-type": "application/json" } });
    });
    const client = new Client({ name: "test", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const omitted = await client.callTool({ name: "hetzner_unified_list_storage_box_folders", arguments: { id: 1 } });
    const explicit = await client.callTool({ name: "hetzner_unified_list_storage_box_folders", arguments: { id: 1, path: "backup" } });
    expect(omitted.isError).not.toBe(true);
    expect(explicit.isError).not.toBe(true);
    expect(urls).toEqual([
      "https://api.hetzner.com/v1/storage_boxes/1/folders",
      "https://api.hetzner.com/v1/storage_boxes/1/folders?path=backup",
    ]);
    await client.close();
    await server.close();
  });

  test("returns DNS record values from a generated RRset tool", async () => {
    const data = { rrset: { id: "rrset-1", name: "@", type: "A", ttl: 300, labels: {}, protection: { change: false }, records: [{ value: "192.0.2.1" }], zone: 1 } };
    const server = createServer(config, async () => new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } }));
    const client = new Client({ name: "test", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const result = await client.callTool({ name: "hetzner_cloud_get_zone_rrset", arguments: { id_or_name: "zone-1", rr_name: "@", rr_type: "A" } });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({ data });
    await client.close();
    await server.close();
  });

  test("returns console credentials from the explicit MCP action", async () => {
    const data = {
      wss_url: "wss://console.hetzner.cloud/?token=one-time-secret",
      password: "one-time-secret",
      action: { id: 1, command: "request_console", status: "running", started: "2026-09-25T00:00:00Z", finished: null, progress: 0, resources: [{ id: 1, type: "server" }] },
    };
    const server = createServer(config, async () => new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } }));
    const client = new Client({ name: "test", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const result = await client.callTool({ name: "hetzner_cloud_request_server_console", arguments: { id: 1 } }) as CallToolResult;
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({ data });
    expect(result.content.find((content) => content.type === "text")?.text).toContain("one-time-secret");
    await client.close();
    await server.close();
  });

  test("accepts successful volume actions without an error field", async () => {
    const response = {
      actions: [{ id: 1, command: "attach_volume", status: "success", progress: 100, started: "2026-09-23T00:00:00Z", finished: "2026-09-23T00:01:00Z", resources: [{ id: 7, type: "volume" }] }],
      meta: emptyServers.meta,
    };
    const server = createServer(config, async () => new Response(JSON.stringify(response), { headers: { "content-type": "application/json" } }));
    const client = new Client({ name: "test", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    for (const call of [
      { name: "hetzner_cloud_list_volumes_actions", arguments: {} },
      { name: "hetzner_cloud_list_volume_actions", arguments: { id: 7 } },
    ]) {
      const result = await client.callTool(call);
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toMatchObject({ data: response });
    }
    await client.close();
    await server.close();
  });

  test("redacts the configured token from generated and retained tool errors", async () => {
    const secret = "Bearer single-secret";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = new Proxy(originalFetch, { apply: () => { throw new Error(secret); } });
    try {
      const server = createServer({ apiToken: "single-secret", timeoutMs: 30_000 }, async () => { throw new Error(secret); });
      const client = new Client({ name: "test", version: "0.0.0" });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
      const generated = await client.callTool({ name: "hetzner_cloud_list_servers", arguments: {} });
      const legacy = await client.callTool({ name: "hetzner_list_server_types", arguments: {} });
      for (const result of [generated, legacy]) {
        expect(JSON.stringify(result)).not.toContain("single-secret");
      }
      await client.close();
      await server.close();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("turns a malformed generated response into a redacted tool error", async () => {
    const server = createServer(config, async () => new Response(JSON.stringify({ servers: [{ id: "not-a-number" }] }), { headers: { "content-type": "application/json" } }));
    const client = new Client({ name: "test", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const result = await client.callTool({ name: "hetzner_cloud_list_servers", arguments: {} });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result)).not.toContain("cloud");
    await client.close();
    await server.close();
  });

  test("routes a retained tool through createServer injection without process credentials", async () => {
    const previousToken = process.env.HETZNER_API_TOKEN;
    delete process.env.HETZNER_API_TOKEN;
    const calls: string[] = [];
    try {
      const server = createServer({ apiToken: "injected-token", timeoutMs: 30_000 }, async (url, init) => {
        calls.push(`${init?.method}:${String(url)}`);
        expect(new Headers(init?.headers).get("authorization")).toBe("Bearer injected-token");
        return new Response(JSON.stringify({ server_types: [{ id: 1, name: "cx22", description: "", cores: 2, memory: 4, disk: 40, prices: [], architecture: "x86", cpu_type: "shared" }] }), { headers: { "content-type": "application/json" } });
      });
      const client = new Client({ name: "test", version: "0.0.0" });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
      const result = await client.callTool({ name: "hetzner_list_server_types", arguments: { response_format: "json" } }) as CallToolResult;
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toBeUndefined();
      expect(result.content.find((content) => content.type === "text")?.text).toContain('"name": "cx22"');
      expect(calls).toEqual(["GET:https://api.hetzner.cloud/v1/server_types"]);
      await client.close();
      await server.close();
    } finally {
      if (previousToken === undefined) delete process.env.HETZNER_API_TOKEN;
      else process.env.HETZNER_API_TOKEN = previousToken;
    }
  });
});

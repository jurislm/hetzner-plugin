import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "bun:test";
import { operations } from "./generated/operations.js";
import { createServer } from "./server.js";

const config = { cloudToken: "cloud", unifiedToken: "unified", timeoutMs: 30_000 };
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

  test("redacts both configured tokens from generated and retained tool errors", async () => {
    const secret = "Bearer cloud-secret and Bearer unified-secret";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error(secret); };
    try {
      const server = createServer({ cloudToken: "cloud-secret", unifiedToken: "unified-secret", timeoutMs: 30_000 }, async () => { throw new Error(secret); });
      const client = new Client({ name: "test", version: "0.0.0" });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
      const generated = await client.callTool({ name: "hetzner_cloud_list_servers", arguments: {} });
      const legacy = await client.callTool({ name: "hetzner_list_server_types", arguments: {} });
      for (const result of [generated, legacy]) {
        expect(JSON.stringify(result)).not.toContain("cloud-secret");
        expect(JSON.stringify(result)).not.toContain("unified-secret");
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
    const previousCloud = process.env.HETZNER_API_TOKEN;
    const previousUnified = process.env.HETZNER_API_TOKEN_UNIFIED;
    delete process.env.HETZNER_API_TOKEN;
    delete process.env.HETZNER_API_TOKEN_UNIFIED;
    const calls: string[] = [];
    try {
      const server = createServer({ cloudToken: "injected-cloud", timeoutMs: 30_000 }, async (url, init) => {
        calls.push(`${init?.method}:${String(url)}`);
        expect(new Headers(init?.headers).get("authorization")).toBe("Bearer injected-cloud");
        return new Response(JSON.stringify({ server_types: [{ id: 1, name: "cx22", description: "", cores: 2, memory: 4, disk: 40, prices: [], architecture: "x86", cpu_type: "shared" }] }), { headers: { "content-type": "application/json" } });
      });
      const client = new Client({ name: "test", version: "0.0.0" });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
      const result = await client.callTool({ name: "hetzner_list_server_types", arguments: { response_format: "json" } });
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toMatchObject({ data: [{ name: "cx22" }] });
      expect(calls).toEqual(["GET:https://api.hetzner.cloud/v1/server_types"]);
      await client.close();
      await server.close();
    } finally {
      if (previousCloud === undefined) delete process.env.HETZNER_API_TOKEN;
      else process.env.HETZNER_API_TOKEN = previousCloud;
      if (previousUnified === undefined) delete process.env.HETZNER_API_TOKEN_UNIFIED;
      else process.env.HETZNER_API_TOKEN_UNIFIED = previousUnified;
    }
  });
});

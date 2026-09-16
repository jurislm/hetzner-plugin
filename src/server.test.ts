import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "bun:test";
import { operations } from "./generated/operations.js";
import { createServer } from "./server.js";

const config = { cloudToken: "cloud", unifiedToken: "unified", timeoutMs: 30_000 };

describe("generated Hetzner MCP server", () => {
  test("registers the combined official contract with safe annotations", async () => {
    const server = createServer(config, async () => new Response(JSON.stringify({ servers: [] }), { headers: { "content-type": "application/json" } }));
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
    const server = createServer(config, async () => new Response(JSON.stringify({ servers: [] }), { headers: { "content-type": "application/json" } }));
    const client = new Client({ name: "test", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const result = await client.callTool({ name: "hetzner_cloud_list_servers", arguments: {} });
    expect(result.structuredContent).toEqual({ data: { servers: [] }, status: 200, request: { method: "GET", path: "/servers" } });
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
});

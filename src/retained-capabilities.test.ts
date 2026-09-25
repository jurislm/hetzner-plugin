import { describe, expect, test } from "bun:test";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerServerSshTools } from "./tools/server-ssh.js";
import { registerServerTools } from "./tools/servers.js";
import { computeStorageBoxStats, registerStorageBoxTools } from "./tools/storage-boxes.js";
import { ListServersResponseSchema, ListSSHKeysResponseSchema, ListVolumesResponseSchema } from "./types.js";

type Captured = { name: string; options: { annotations?: Record<string, unknown> }; handler: (input: any) => Promise<any> };
function capture(register: (server: McpServer, ...args: any[]) => void, ...args: any[]): Captured[] {
  const tools: Captured[] = [];
  register({ registerTool: (name: string, options: Captured["options"], handler: Captured["handler"]) => tools.push({ name, options, handler }) } as unknown as McpServer, ...args);
  return tools;
}

const box = {
  id: 7, name: "archive", username: "u7", status: "active", server: null, system: null,
  storage_box_type: { id: 1, name: "bx", description: "", size: 10 * 1024 ** 3 },
  location: { id: 1, name: "fsn1", description: "", country: "DE", city: "Falkenstein" }, labels: {}, protection: { delete: false },
  access_settings: { reachable_externally: false, ssh_enabled: true, webdav_enabled: false, samba_enabled: false, zfs_enabled: false },
  stats: { size: 4 * 1024 ** 3, size_data: 3 * 1024 ** 3, size_snapshots: 1024 ** 3 }, snapshot_plan: null, created: "2026-01-01T00:00:00+00:00",
} as const;

describe("retained v1.5 capabilities", () => {
  test("requires pagination metadata for Cloud list responses", () => {
    const pagination = { page: 1, per_page: 25, previous_page: null, next_page: null, last_page: 1, total_entries: 0 };
    const responses = [
      [ListServersResponseSchema, { servers: [] }],
      [ListSSHKeysResponseSchema, { ssh_keys: [] }],
      [ListVolumesResponseSchema, { volumes: [] }],
    ] as const;
    for (const [schema, list] of responses) {
      expect(schema.safeParse({ ...list, meta: { pagination } }).success).toBe(true);
      expect(schema.safeParse(list).success).toBe(false);
      expect(schema.safeParse({ ...list, meta: {} }).success).toBe(false);
    }
  });

  test("computes Storage Box snapshot-inclusive capacity", () => {
    expect(computeStorageBoxStats(box as any)).toMatchObject({ used_gib: 4, available_gib: 6, usage_percent: 40 });
  });

  test("runs Storage Box stats and assert-space tools through injected Unified requests", async () => {
    const calls: string[] = [];
    const tools = capture(registerStorageBoxTools, async (path: string) => { calls.push(path); return { storage_box: box }; });
    const stats = await tools.find((tool) => tool.name === "hetzner_get_storage_box_stats")!.handler({ id: 7, response_format: "json" });
    const assertion = await tools.find((tool) => tool.name === "hetzner_assert_storage_box_space")!.handler({ id: 7, required_gib: 7, response_format: "json" });
    expect(JSON.parse(stats.content[0].text)).toMatchObject({ available_gib: 6 });
    expect(assertion.isError).toBe(true);
    expect(JSON.parse(assertion.content[0].text)).toMatchObject({ ok: false, required_gib: 7 });
    expect(calls).toEqual(["/storage_boxes/7", "/storage_boxes/7"]);
    expect(tools.find((tool) => tool.name === "hetzner_assert_storage_box_space")!.options.annotations).toMatchObject({ readOnlyHint: true, idempotentHint: true });
  });

  test("runs server RAM over SSH with a resolved Cloud server", async () => {
    const tools = capture(registerServerSshTools, async () => "Mem: 1000 250 100 0 0 750\nSwap: 0 0 0", undefined, async () => ({ server: { public_net: { ipv4: { ip: "1.2.3.4" } } } }));
    const result = await tools.find((tool) => tool.name === "hetzner_get_server_ram")!.handler({ id: 9, response_format: "json" });
    expect(JSON.parse(result.content[0].text)).toMatchObject({ server: { id: 9, ipv4: "1.2.3.4" }, ram: { available: 750 } });
    expect(tools.find((tool) => tool.name === "hetzner_get_server_ram")!.options.annotations).toMatchObject({ readOnlyHint: true });
  });

  test("sends retained server creation through the documented method, path, and body", async () => {
    const calls: any[] = [];
    const tools = capture(registerServerTools, async (...args: any[]) => { calls.push(args); return { server: { id: 1, name: "api" }, root_password: null }; });
    const result = await tools.find((tool) => tool.name === "hetzner_create_server")!.handler({ name: "api", server_type: "cx22", image: "ubuntu-24.04", start_after_create: true, response_format: "json" });
    expect(result.isError).toBeUndefined();
    expect(calls[0].slice(0, 4)).toEqual(["/servers", expect.anything(), "POST", { name: "api", server_type: "cx22", image: "ubuntu-24.04", start_after_create: true }]);
    expect(tools.find((tool) => tool.name === "hetzner_create_server")!.options.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false });
  });
});

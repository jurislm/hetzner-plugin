import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("serves the generated catalog through shipped local stdio and ignores local files when the dashboard field is empty or an unsubstituted placeholder", async () => {
  expect(await Bun.file("dist/index.js").exists()).toBe(true);
  const home = mkdtempSync(join(tmpdir(), "hetzner-no-local-env-"));
  try {
    mkdirSync(join(home, ".config", "jurislm"), { recursive: true });
    const fakeFile = "HETZNER_API_TOKEN=fixture-plugin-env-token\n";
    writeFileSync(join(home, ".config", "jurislm", "plugin.env"), fakeFile);
    writeFileSync(join(home, ".zshenv"), `export ${fakeFile}`);
    for (const value of ["${HETZNER_API_TOKEN}", ""]) {
      const env = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined));
      env.HOME = home;
      env.HETZNER_API_TOKEN = value;
      env.JURISLM_PLUGIN_ENV = join(home, ".config", "jurislm", "plugin.env");
      const transport = new StdioClientTransport({ command: "bun", args: ["dist/index.js"], env, stderr: "pipe" });
      const client = new Client({ name: "stdio-test", version: "0.0.0" });
      await client.connect(transport);
      expect((await client.listTools()).tools.some((tool) => tool.name === "hetzner_cloud_list_servers")).toBe(true);
      const call = await client.callTool({ name: "hetzner_cloud_list_servers", arguments: {} });
      expect(call.isError).toBe(true);
      expect(call.content).toContainEqual(expect.objectContaining({ text: expect.stringContaining("HETZNER_API_TOKEN is required") }));
      expect(call.content).toContainEqual(expect.objectContaining({ text: expect.stringContaining("請到 Cursor 管理頁外掛設定填 HETZNER_API_TOKEN") }));
      await client.close();
    }
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

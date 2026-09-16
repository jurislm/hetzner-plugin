import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { expect, test } from "bun:test";

test("serves the generated catalog through shipped local stdio", async () => {
  const configured = JSON.parse(await Bun.file("mcp.json").text()) as { mcpServers: { hetzner: { command: string; args: string[]; cwd?: string } } };
  const server = configured.mcpServers.hetzner;
  expect(Bun.spawnSync([process.execPath, "run", "build"], { cwd: process.cwd() }).exitCode).toBe(0);
  const env = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined));
  const transport = new StdioClientTransport({
    command: server.command, args: server.args, cwd: server.cwd ? new URL(server.cwd, `file://${process.cwd()}/`).pathname : process.cwd(),
    env: { ...env, HETZNER_API_TOKEN: "cloud-test" }, stderr: "pipe",
  });
  const client = new Client({ name: "stdio-test", version: "0.0.0" });
  await client.connect(transport);
  expect((await client.listTools()).tools.some((tool) => tool.name === "hetzner_cloud_list_servers")).toBe(true);
  await client.close();
});

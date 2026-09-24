import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { expect, test } from "bun:test";

test("serves the generated catalog through shipped local stdio", async () => {
  expect(await Bun.file("dist/index.js").exists()).toBe(true);
  const env = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined));
  delete env.HETZNER_API_TOKEN;
  const transport = new StdioClientTransport({
    command: "bun", args: ["dist/index.js"],
    env, stderr: "pipe",
  });
  const client = new Client({ name: "stdio-test", version: "0.0.0" });
  await client.connect(transport);
  expect((await client.listTools()).tools.some((tool) => tool.name === "hetzner_cloud_list_servers")).toBe(true);
  const call = await client.callTool({ name: "hetzner_cloud_list_servers", arguments: {} });
  expect(call.isError).toBe(true);
  expect(call.content).toContainEqual(expect.objectContaining({ text: expect.stringContaining("HETZNER_API_TOKEN is required") }));
  await client.close();
});

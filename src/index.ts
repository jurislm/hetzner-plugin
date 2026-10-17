#!/usr/bin/env bun
import { CREDENTIAL_GROUPS, loadConfig } from "./config.js";
import { withPluginEnv } from "./plugin-env.js";
import { createServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main(): Promise<void> {
  const server = createServer(loadConfig(withPluginEnv(process.env, CREDENTIAL_GROUPS)));
  await server.connect(new StdioServerTransport());
  console.error("Hetzner plugin running via stdio");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

#!/usr/bin/env bun
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";
import { createStdioTransport } from "./transports/stdio.js";

async function main(): Promise<void> {
  const server = createServer(loadConfig());
  await server.connect(createStdioTransport());
  console.error("Hetzner plugin running via stdio");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

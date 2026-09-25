import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HetznerClient, redactSensitive, type FetchLike } from "./client.js";
import { createApiRequest } from "./api.js";
import type { HetznerConfig } from "./config.js";
import { formatToolError } from "./errors.js";
import { operations } from "./generated/operations.js";
import { pluginVersion } from "./version.js";
import { registerMetricsTools } from "./tools/metrics.js";
import { registerReferenceTools } from "./tools/reference.js";
import { registerServerSshTools } from "./tools/server-ssh.js";
import { registerServerTools } from "./tools/servers.js";
import { registerSSHKeyTools } from "./tools/ssh-keys.js";
import { registerStorageBoxTools } from "./tools/storage-boxes.js";
import { registerVolumeTools } from "./tools/volumes.js";

const outputSchema = z.object({ data: z.unknown(), status: z.number(), request: z.object({ method: z.string(), path: z.string() }) });

export function createServer(config: HetznerConfig, fetchImpl?: FetchLike): McpServer {
  const requestFetch = fetchImpl ?? fetch;
  const client = new HetznerClient(config, requestFetch);
  const cloudRequest = createApiRequest(config, requestFetch, "cloud");
  const unifiedRequest = createApiRequest(config, requestFetch, "unified");
  const server = new McpServer({ name: "hetzner-plugin", version: pluginVersion }, { instructions: "Resolve resources with read tools before mutations. Never expose credentials or secrets." });
  for (const operation of operations) server.registerTool(operation.name, {
    title: operation.name, description: operation.description, inputSchema: operation.inputSchema,
    outputSchema, annotations: operation.annotations,
  }, async (input) => {
    try {
      const envelope = await client.request(operation, input as Record<string, unknown>);
      const data = operation.responseSchema.parse(envelope.data);
      const structuredContent = redactSensitive({ ...envelope, data }) as unknown as Record<string, unknown>;
      return { structuredContent, content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }] };
    } catch (error) {
      const details = formatToolError(error, [config.apiToken]);
      return { isError: true, content: [{ type: "text" as const, text: JSON.stringify({ error: details }) }] };
    }
  });
  registerReferenceTools(server, cloudRequest);
  registerSSHKeyTools(server, cloudRequest);
  registerServerTools(server, cloudRequest);
  registerStorageBoxTools(server, unifiedRequest);
  registerVolumeTools(server, cloudRequest);
  registerMetricsTools(server, cloudRequest);
  registerServerSshTools(server, undefined, undefined, cloudRequest);
  return server;
}

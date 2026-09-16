import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HetznerClient, redactSensitive, type FetchLike } from "./client.js";
import { createApiRequest } from "./api.js";
import type { HetznerConfig } from "./config.js";
import { formatToolError } from "./errors.js";
import { operations } from "./generated/operations.js";
import { registerMetricsTools } from "./tools/metrics.js";
import { registerReferenceTools } from "./tools/reference.js";
import { registerServerSshTools } from "./tools/server-ssh.js";
import { registerServerTools } from "./tools/servers.js";
import { registerSSHKeyTools } from "./tools/ssh-keys.js";
import { registerStorageBoxTools } from "./tools/storage-boxes.js";
import { registerVolumeTools } from "./tools/volumes.js";

const outputSchema = z.object({ data: z.unknown(), status: z.number(), request: z.object({ method: z.string(), path: z.string() }) });
const annotations = (name: string) => ({ readOnlyHint: !/create|delete|update|set|reset|reboot|shutdown|power|attach|detach|change|enable|disable/iu.test(name), destructiveHint: /delete|destroy|remove/iu.test(name), idempotentHint: /^hetzner_(get|list)/u.test(name), openWorldHint: false });

function legacyServer(server: McpServer, config: HetznerConfig): McpServer {
  return new Proxy(server, { get(target, property, receiver) {
    const value = Reflect.get(target, property, receiver);
    if (property !== "registerTool" || typeof value !== "function") return typeof value === "function" ? value.bind(target) : value;
    return (name: string, options: Record<string, unknown>, handler: (input: unknown) => Promise<Record<string, unknown>>) => value.call(target, name, {
      ...options, outputSchema, annotations: options.annotations ?? annotations(name),
    }, async (input: unknown) => {
      try {
        const result = await handler(input);
        const text = (result.content as Array<{ text?: string }> | undefined)?.[0]?.text;
        if (result.isError) {
          const details = formatToolError(new Error(text ?? "Legacy tool error"), [config.cloudToken, config.unifiedToken]);
          return { isError: true, content: [{ type: "text" as const, text: JSON.stringify({ error: details }) }] };
        }
        let data: unknown = result.structuredContent ?? text ?? result;
        if (typeof data === "string") try { data = JSON.parse(data); } catch { /* markdown is preserved as text data */ }
        const structuredContent = redactSensitive({ data, status: 200, request: { method: "LOCAL", path: `legacy/${name}` } }) as Record<string, unknown>;
        return { structuredContent, content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }] };
      } catch (error) {
        const details = formatToolError(error, [config.cloudToken, config.unifiedToken]);
        return { isError: true, content: [{ type: "text" as const, text: JSON.stringify({ error: details }) }] };
      }
    });
  } }) as McpServer;
}

export function createServer(config: HetznerConfig, fetchImpl?: FetchLike): McpServer {
  const requestFetch = fetchImpl ?? fetch;
  const client = new HetznerClient(config, requestFetch);
  const cloudRequest = createApiRequest(config, requestFetch, "cloud");
  const unifiedRequest = createApiRequest(config, requestFetch, "unified");
  const server = new McpServer({ name: "hetzner-plugin", version: "0.1.0" }, { instructions: "Resolve resources with read tools before mutations. Never expose credentials or secrets." });
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
      const details = formatToolError(error, [config.cloudToken, config.unifiedToken]);
      return { isError: true, content: [{ type: "text" as const, text: JSON.stringify({ error: details }) }] };
    }
  });
  const legacy = legacyServer(server, config);
  registerReferenceTools(legacy, cloudRequest);
  registerSSHKeyTools(legacy, cloudRequest);
  registerServerTools(legacy, cloudRequest);
  registerStorageBoxTools(legacy, unifiedRequest);
  registerVolumeTools(legacy, cloudRequest);
  registerMetricsTools(legacy, cloudRequest);
  registerServerSshTools(legacy, undefined, undefined, cloudRequest);
  return server;
}

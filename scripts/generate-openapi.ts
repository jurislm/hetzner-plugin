import { mkdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { jsonSchemaToZod } from "json-schema-to-zod";
import YAML from "yaml";

type ObjectValue = Record<string, any>;
type Document = { paths?: Record<string, ObjectValue>; components?: { schemas?: Record<string, ObjectValue> } };
const specs = [
  { source: "cloud", file: "openapi/hetzner-cloud-openapi.json", types: "src/generated/hetzner-cloud-api.ts" },
  { source: "unified", file: "openapi/hetzner-unified-openapi.json", types: "src/generated/hetzner-unified-api.ts" },
] as const;
const methods = new Set(["get", "put", "post", "delete", "patch", "head", "options", "trace"]);
const schemaTypes = new Set(["object", "array", "string", "number", "integer", "boolean", "null"]);
const quote = JSON.stringify;

function dereference(value: any, schemas: Record<string, ObjectValue>, seen = new Set<string>()): any {
  if (Array.isArray(value)) return value.map((item) => dereference(item, schemas, seen));
  if (!value || typeof value !== "object") return value;
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/components/schemas/")) {
    const name = value.$ref.slice("#/components/schemas/".length);
    return seen.has(name) ? {} : dereference(schemas[name] ?? {}, schemas, new Set([...seen, name]));
  }
  const result: ObjectValue = {};
  for (const [key, child] of Object.entries(value)) if (key !== "$ref") result[key] = dereference(child, schemas, seen);
  if (result.properties?.command && result.properties?.resources && result.properties?.error && Array.isArray(result.required)) result.required = result.required.filter((name: string) => name !== "error");
  return result.nullable === true ? { anyOf: [Object.fromEntries(Object.entries(result).filter(([key]) => key !== "nullable")), { type: "null" }] } : result;
}

function schemaText(schema: any, schemas: Record<string, ObjectValue>, optional = false): string {
  if (schema === false) return "z.never()";
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) throw new Error("Cannot generate a Zod schema from a missing or non-object OpenAPI schema");
  try {
    const converted = jsonSchemaToZod(dereference(schema, schemas), {
      noImport: true,
      parserOverride: (node, refs) => {
        const hasSupportedType = Array.isArray(node.type)
          ? node.type.length > 0 && node.type.every((type) => schemaTypes.has(type))
          : typeof node.type === "string" && schemaTypes.has(node.type);
        const hasSupportedComposition = [node.anyOf, node.allOf, node.oneOf].some((value) => Array.isArray(value) && value.length > 0);
        const hasSupportedConstraint = node.not !== undefined || node.enum !== undefined || node.const !== undefined;
        const hasCompleteConditional = node.if !== undefined && node.then !== undefined && node.else !== undefined;
        if (!hasSupportedType && !hasSupportedComposition && !hasSupportedConstraint && !hasCompleteConditional) {
          throw new Error(`No supported JSON Schema validator at ${refs.path.join("/") || "<root>"}`);
        }
      },
    }).trim()
      .replaceAll('.ip({ version: "v4" })', ".ipv4()")
      .replaceAll('.ip({ version: "v6" })', ".ipv6()");
    return optional && schema.default === undefined && !converted.endsWith(".optional()") ? `${converted}.optional()` : converted;
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate a Zod schema from OpenAPI: ${details}; schema=${JSON.stringify(schema)}`, { cause: error });
  }
}

function responseInfo(operation: ObjectValue, schemas: Record<string, ObjectValue>): { schema: string; kind: string } {
  const response = Object.entries(operation.responses ?? {}).find(([status]) => /^2\d\d$/u.test(status))?.[1] as ObjectValue | undefined;
  const content = response?.content ?? {};
  const contentType = Object.keys(content)[0];
  if (!contentType) return { schema: "z.null()", kind: "empty" };
  if (contentType.includes("json")) return { schema: schemaText(content[contentType]?.schema, schemas), kind: "json" };
  if (contentType.startsWith("text/") || contentType.includes("xml")) return { schema: "z.string()", kind: "text" };
  return { schema: "z.object({ encoding: z.literal(\"base64\"), contentType: z.string(), value: z.string() })", kind: "binary" };
}

await mkdir("src/generated", { recursive: true });
const generated: string[] = [];
const usedNames = new Set<string>();
for (const source of specs) {
  const raw = await readFile(source.file, "utf8");
  const document = YAML.parse(raw) as Document;
  const types = spawnSync("bunx", ["openapi-typescript", source.file, "-o", source.types], { encoding: "utf8" });
  if (types.status !== 0) throw new Error(`openapi-typescript failed for ${source.source}:\n${types.stdout}\n${types.stderr}`);
  const schemas = document.components?.schemas ?? {};
  for (const [path, pathItem] of Object.entries(document.paths ?? {})) for (const [method, value] of Object.entries(pathItem)) {
    if (!methods.has(method)) continue;
    const operation = value as ObjectValue;
    const operationId = String(operation.operationId ?? `${method}_${path}`).replace(/[^a-zA-Z0-9]+/gu, "_").replace(/^_|_$/gu, "").toLowerCase();
    const name = `hetzner_${source.source}_${operationId}`;
    if (usedNames.has(name)) throw new Error(`OpenAPI operation-name collision: ${name}`);
    usedNames.add(name);
    const parameters = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])] as ObjectValue[];
    const properties: string[] = [];
    const parameterMeta: string[] = [];
    for (const parameter of parameters) {
      if (parameter.in === "header") continue;
      const schema = { ...(parameter.schema ?? { type: "string" }) };
      if (parameter.in === "query" && schema.default === ".") delete schema.default;
      properties.push(`${quote(String(parameter.name))}: ${schemaText(schema, schemas, !parameter.required)}`);
      parameterMeta.push(`{ location: ${quote(parameter.in)}, name: ${quote(String(parameter.name))} }`);
    }
    const requestBody = operation.requestBody as ObjectValue | undefined;
    const bodyContent = requestBody?.content ?? {};
    const bodyType = Object.keys(bodyContent)[0];
    if (bodyType) properties.push(`body: ${schemaText(bodyContent[bodyType]?.schema, schemas, !requestBody.required)}`);
    const response = responseInfo(operation, schemas);
    const description = String(operation.summary ?? operation.operationId ?? `${method.toUpperCase()} ${path}`);
    const destructive = method === "delete" || /power[_-]?off|poweroff|reboot|rebuild|shutdown|rollback|change[_-]?type|delete|remove|destroy|reset|revoke/iu.test(`${operationId} ${path} ${description}`);
    generated.push(`  { source: ${quote(source.source)}, name: ${quote(name)}, method: ${quote(method.toUpperCase())}, path: ${quote(path)}, description: ${quote(description)}, inputSchema: z.object({ ${properties.join(", ")} }), responseSchema: ${response.schema}, responseKind: ${quote(response.kind)}, parameters: [${parameterMeta.join(", ")}], annotations: { readOnlyHint: ${method === "get" || method === "head"}, destructiveHint: ${destructive}, idempotentHint: ${["get", "head", "put", "delete", "options"].includes(method)}, openWorldHint: false } }`);
  }
}
await Bun.write("src/generated/operations.ts", ["// Generated by scripts/generate-openapi.ts.", 'import { z } from "zod";', "", "export type GeneratedOperation = { source: \"cloud\" | \"unified\"; name: string; method: string; path: string; description: string; inputSchema: z.ZodType; responseSchema: z.ZodType; responseKind: string; parameters: Array<{ location: string; name: string }>; annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean } };", "", "export const operations: GeneratedOperation[] = [", generated.join(",\n"), "];", ""].join("\n"));
console.error(`Generated ${generated.length} Hetzner operations`);

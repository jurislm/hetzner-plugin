import { mkdir } from "node:fs/promises";
import { hashSnapshot, persistedSnapshot } from "../src/openapi-integrity.js";

const sources = [
  { name: "cloud", url: "https://docs.hetzner.cloud/cloud.spec.json", path: "openapi/hetzner-cloud-openapi.json" },
  { name: "unified", url: "https://docs.hetzner.cloud/hetzner.spec.json", path: "openapi/hetzner-unified-openapi.json" },
] as const;
const methods = new Set(["get", "put", "post", "delete", "patch", "head", "options", "trace"]);

const manifest: Record<string, unknown> = {};
await mkdir("openapi", { recursive: true });
for (const source of sources) {
  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`OpenAPI download failed for ${source.name}: ${response.status} ${response.statusText}`);
  const text = persistedSnapshot(await response.text());
  const spec = JSON.parse(text) as { openapi?: string; info?: { version?: string }; paths?: Record<string, Record<string, unknown>> };
  const paths = spec.paths ?? {};
  manifest[source.name] = {
    sourceUrl: source.url,
    fetchedAt: new Date().toISOString(),
    sha256: hashSnapshot(text),
    openapiVersion: spec.openapi ?? "unknown",
    infoVersion: spec.info?.version ?? "unknown",
    pathCount: Object.keys(paths).length,
    operationCount: Object.values(paths).reduce((count, item) => count + Object.keys(item).filter((method) => methods.has(method)).length, 0),
  };
  await Bun.write(source.path, text);
}
await Bun.write("openapi/manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.error(`Fetched ${sources.length} Hetzner OpenAPI snapshots`);

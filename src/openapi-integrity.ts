import { join } from "node:path";

type Snapshot = { path: string; sha256: string; operationCount: number };
type Manifest = Record<"cloud" | "unified", Snapshot>;

export function persistedSnapshot(text: string): string {
  return text.endsWith("\n") ? text : `${text}\n`;
}

export function hashSnapshot(text: string): string {
  const hash = new Bun.CryptoHasher("sha256");
  hash.update(text);
  return hash.digest("hex");
}

export async function verifyOpenApiManifest(root: string): Promise<Record<"cloud" | "unified", number>> {
  const manifest = JSON.parse(await Bun.file(join(root, "openapi/manifest.json")).text()) as Manifest;
  const paths = { cloud: "openapi/hetzner-cloud-openapi.json", unified: "openapi/hetzner-unified-openapi.json" } as const;
  for (const source of ["cloud", "unified"] as const) {
    const text = await Bun.file(join(root, paths[source])).text();
    if (hashSnapshot(text) !== manifest[source].sha256) throw new Error(`${source} OpenAPI snapshot hash does not match manifest`);
  }
  return { cloud: manifest.cloud.operationCount, unified: manifest.unified.operationCount };
}

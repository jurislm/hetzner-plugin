import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { hashSnapshot, persistedSnapshot, verifyOpenApiManifest } from "./openapi-integrity.js";

describe("OpenAPI snapshot integrity", () => {
  test("hashes the exact persisted bytes, including an appended final newline", async () => {
    expect(persistedSnapshot("{}")).toBe("{}\n");
    expect(hashSnapshot("{}\n")).not.toBe(hashSnapshot("{}"));
    await expect(verifyOpenApiManifest(process.cwd())).resolves.toEqual({ cloud: 190, unified: 32 });
  });

  test("rejects an offline manifest whose committed snapshot hash was tampered", async () => {
    const root = await mkdtemp(join(tmpdir(), "hetzner-openapi-"));
    try {
      await mkdir(join(root, "openapi"));
      await Bun.write(join(root, "openapi/hetzner-cloud-openapi.json"), "{}\n");
      await Bun.write(join(root, "openapi/hetzner-unified-openapi.json"), "{}\n");
      await mkdir(join(root, "api"));
      await Bun.write(join(root, "api/manifest.json"), JSON.stringify({
        cloud: { sha256: "wrong", operationCount: 190 }, unified: { sha256: "wrong", operationCount: 32 },
      }));
      await expect(verifyOpenApiManifest(root)).rejects.toThrow("cloud OpenAPI snapshot hash does not match manifest");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

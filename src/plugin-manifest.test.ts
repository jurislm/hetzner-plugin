import { expect, test } from "bun:test";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

type Json = Record<string, unknown>;
const files = ["plugin.json", ".codex-plugin/plugin.json", ".cursor-plugin/marketplace.json", ".cursor-plugin/plugin.json", "mcp.json", ".mcp.json", ".mcp.json.example", ".app.json.example", "package.json"];

async function validate(change: (manifests: Record<string, Json>) => void) {
  const directory = mkdtempSync(join(tmpdir(), "hetzner-manifests-"));
  try {
    const manifests = Object.fromEntries(await Promise.all(files.map(async (file) => [file, await Bun.file(file).json() as Json])));
    change(manifests);
    for (const file of files) {
      cpSync(file, join(directory, file), { recursive: true });
      writeFileSync(join(directory, file), JSON.stringify(manifests[file]));
    }
    cpSync("schemas", join(directory, "schemas"), { recursive: true });
    const result = Bun.spawnSync([process.execPath, resolve("scripts/validate-plugin-manifests.ts")], { cwd: directory, stdout: "pipe", stderr: "pipe" });
    return { code: result.exitCode, error: new TextDecoder().decode(result.stderr) };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function server(manifest: Json): Json {
  return (manifest.mcpServers as Record<string, Json>).hetzner;
}

test("native credential forwarding can differ from portable MCP fields", async () => {
  const result = await validate((manifests) => {
    server(manifests[".mcp.json"]).env_vars = ["HETZNER_API_TOKEN"];
  });
  expect(result.code).toBe(0);
});

test("portable plugin metadata must satisfy its committed schema", async () => {
  const result = await validate((manifests) => { manifests["plugin.json"].keywords = "hetzner"; });
  expect(result.code).not.toBe(0);
  expect(result.error).toContain("plugin.json:");
});

test.each(["env_vars", "env"])("portable MCP rejects %s credential settings", async (field) => {
  const result = await validate((manifests) => {
    const value = field === "env_vars" ? ["HETZNER_API_TOKEN"] : { HETZNER_API_TOKEN: "fixture-token" };
    for (const file of ["mcp.json", ".mcp.json"]) server(manifests[file])[field] = value;
  });
  expect(result.code).not.toBe(0);
  expect(result.error).toContain("mcp.json:");
});

test("native MCP must preserve the portable launch target", async () => {
  const result = await validate((manifests) => {
    server(manifests[".mcp.json"]).args = ["-y", "@jurislm/hetzner-plugin@latest", "different"];
  });
  expect(result.code).not.toBe(0);
  expect(result.error).toContain("registrations");
});

test("native MCP only forwards the supported credential", async () => {
  const result = await validate((manifests) => {
    server(manifests[".mcp.json"]).env_vars = ["UNRELATED_SECRET"];
  });
  expect(result.code).not.toBe(0);
  expect(result.error).toContain("HETZNER_API_TOKEN");
});

const result = Bun.spawnSync(["npm", "pack", "--dry-run", "--json"], { cwd: process.cwd(), stdout: "pipe", stderr: "pipe" });
if (result.exitCode !== 0) throw new Error(new TextDecoder().decode(result.stderr));
const packed = JSON.parse(new TextDecoder().decode(result.stdout)) as Array<{ files: Array<{ path: string }> }>;
const paths = new Set(packed[0]?.files.map((file) => file.path));
for (const path of ["dist/index.js", "plugin.json", "mcp.json", ".mcp.json", ".mcp.json.example", ".app.json.example", ".codex-plugin/plugin.json", "skills/hetzner/SKILL.md", "README.md", "LICENSE", "api/manifest.json"]) if (!paths.has(path)) throw new Error(`package is missing ${path}`);
const manifests = [...paths].filter((path) => /(^|\/)manifest\.json$/u.test(path));
if (JSON.stringify(manifests) !== JSON.stringify(["api/manifest.json"])) throw new Error(`Package must ship exactly api/manifest.json, found ${manifests.join(", ")}`);
if ([...paths].some((path) => /(^|\/)(\.env|.*\.pem|.*\.key)$/iu.test(path))) throw new Error("package must not contain credential files");
console.error("Package contents valid");

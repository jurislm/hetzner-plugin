import { parseBunPackOutput } from "./package-contents.js";

const result = Bun.spawnSync([process.execPath, "pm", "pack", "--dry-run"], { cwd: process.cwd(), stdout: "pipe", stderr: "pipe" });
if (result.exitCode !== 0) throw new Error(new TextDecoder().decode(result.stderr));
const output = new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
const packed = parseBunPackOutput(output);
const paths = new Set(packed.paths);
for (const path of ["dist/index.js", "plugin.json", "mcp.json", ".mcp.json", ".mcp.json.example", ".app.json.example", ".codex-plugin/plugin.json", "skills/hetzner/SKILL.md", "README.md", "LICENSE", "api/manifest.json"]) if (!paths.has(path)) throw new Error(`package is missing ${path}`);
const manifests = packed.paths.filter((path) => /(^|\/)manifest\.json$/u.test(path));
if (JSON.stringify(manifests) !== JSON.stringify(["api/manifest.json"])) throw new Error(`Package must ship exactly api/manifest.json, found ${manifests.join(", ")}`);
if (packed.paths.some((path) => /(^|\/)(\.env|.*\.pem|.*\.key)$/iu.test(path))) throw new Error("package must not contain credential files");
console.error(`Package contents valid: ${packed.totalFiles} files`);

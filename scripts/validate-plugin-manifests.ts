import Ajv2020 from "ajv/dist/2020.js";
import { isDeepStrictEqual } from "node:util";

type Json = Record<string, unknown>;
const files = ["plugin.json", ".codex-plugin/plugin.json", ".cursor-plugin/marketplace.json", ".cursor-plugin/plugin.json", "mcp.json", ".mcp.json", ".mcp.json.example", ".app.json.example"];
const parsed = Object.fromEntries(await Promise.all(files.map(async (file) => [file, JSON.parse(await Bun.file(file).text()) as Json])));
const ajv = new Ajv2020({ allErrors: true, strict: false });
for (const [file, schemaFile] of [["plugin.json", "plugin.schema.json"], ["mcp.json", "mcp.schema.json"]]) {
  const validate = ajv.compile(await Bun.file(`schemas/${schemaFile}`).json() as Json);
  if (!validate(parsed[file])) throw new Error(`${file}: ${ajv.errorsText(validate.errors)}`);
}
const packageJson = JSON.parse(await Bun.file("package.json").text()) as Json;
const packageVersion = String(packageJson.version);
const repositoryUrl = "https://github.com/jurislm/hetzner-plugin";
const officialWebsiteUrl = "https://jurislm.github.io/hetzner-plugin/";
const portableKeys = ["$schema", "name", "version", "description", "author", "homepage", "repository", "license", "keywords", "extensions"];
const unexpectedPortableKeys = Object.keys(parsed["plugin.json"]).filter((key) => !portableKeys.includes(key));
if (unexpectedPortableKeys.length > 0) throw new Error(`plugin.json contains non-portable fields: ${unexpectedPortableKeys.join(", ")}`);
const portableInterface = (((parsed["plugin.json"].extensions as Json)["com.openai"] as Json).interface as Json);
const fallbackInterface = parsed[".codex-plugin/plugin.json"].interface as Json;
if (parsed["plugin.json"].$schema !== "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json") throw new Error("plugin.json must use the portable Agent Plugins schema");
if (portableInterface.displayName !== "Hetzner Plugin") throw new Error("plugin.json must provide extensions.com.openai.interface");
if (JSON.stringify(portableInterface.defaultPrompt) !== JSON.stringify(["List my Hetzner Cloud servers."])) throw new Error("plugin.json must provide the portable Hetzner starter prompt");
for (const manifestInterface of [portableInterface, fallbackInterface]) {
  if (manifestInterface.category !== "Developer tools") throw new Error("Plugin interface category must match Woodpecker");
  if (JSON.stringify(manifestInterface.capabilities) !== JSON.stringify(["Read", "Write"])) throw new Error("Plugin capabilities must match Woodpecker");
  if (manifestInterface.composerIcon !== "./assets/hetzner.png" || manifestInterface.logo !== "./assets/hetzner.png") throw new Error("Plugin icons must use the shipped Hetzner PNG");
  if (manifestInterface.websiteURL !== officialWebsiteUrl) throw new Error("Plugin websiteURL must point to the official GitHub Pages site");
}
if (parsed["plugin.json"].homepage !== officialWebsiteUrl || parsed["plugin.json"].repository !== repositoryUrl) throw new Error("Portable manifest homepage and repository metadata must match their canonical URLs");
if ((parsed[".codex-plugin/plugin.json"].repository as string) !== repositoryUrl) throw new Error("Fallback manifest repository metadata must match the public repository");
if (parsed["mcp.json"].$schema !== "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json") throw new Error("mcp.json must use the portable Agent Plugins schema");
if (((parsed[".cursor-plugin/marketplace.json"].owner as Json).name) !== "JurisLM") throw new Error("Cursor marketplace must include its required owner");
const cursorMarketplacePlugins = parsed[".cursor-plugin/marketplace.json"].plugins as Json[];
if (cursorMarketplacePlugins.some((plugin) => Object.keys(plugin).some((key) => !["name", "source", "description", "minClientVersions"].includes(key)))) throw new Error("Cursor marketplace plugin entries contain unsupported fields");
const cursorPlugin = parsed[".cursor-plugin/plugin.json"];
if (cursorPlugin.displayName !== "Hetzner Plugin" || (cursorPlugin.author as Json).name !== "JurisLM" || cursorPlugin.homepage !== officialWebsiteUrl || cursorPlugin.repository !== repositoryUrl) throw new Error("Cursor plugin must provide canonical website and repository metadata");
for (const file of ["plugin.json", ".codex-plugin/plugin.json"]) if (parsed[file].name !== "hetzner-plugin" || parsed[file].version !== packageVersion) throw new Error(`${file} is not the portable Hetzner manifest for ${packageVersion}`);
const server = (parsed[".mcp.json"].mcpServers as Json).hetzner as Json;
if (server.type !== "stdio" || server.command !== "bunx" || "cwd" in server || "url" in server || "serverUrl" in server || !(server.args as string[]).includes("@jurislm/hetzner-plugin@latest")) throw new Error(".mcp.json must match the Woodpecker bunx stdio registration");
if (!isDeepStrictEqual(server.env_vars, ["HETZNER_API_TOKEN"])) throw new Error(".mcp.json must forward only HETZNER_API_TOKEN");
const portableServers = parsed["mcp.json"].mcpServers as Record<string, Json>;
for (const portableServer of Object.values(portableServers)) {
  if ("env" in portableServer || /\$\{(?!PLUGIN_ROOT\}|PLUGIN_DATA\})[^}]+\}/u.test(JSON.stringify(portableServer))) throw new Error("mcp.json: credentials must come from the host environment");
}
const nativeServers = Object.fromEntries(Object.entries(parsed[".mcp.json"].mcpServers as Record<string, Json>).map(([name, nativeServer]) => [name, Object.fromEntries(Object.entries(nativeServer).filter(([key]) => key !== "env_vars"))]));
if (!isDeepStrictEqual(nativeServers, portableServers)) throw new Error("Codex and portable MCP registrations must agree on server identity, transport and launch target");
const exampleServer = (parsed[".mcp.json.example"].mcpServers as Json).hetzner as Json;
if (exampleServer.command !== "bunx" || !(exampleServer.args as string[]).includes("@jurislm/hetzner-plugin@latest")) throw new Error(".mcp.json.example must match the Woodpecker bunx registration");
if (packageJson.private === true || (packageJson.engines as Json).bun !== ">=1.1.0") throw new Error("package must be public and require Bun >=1.1.0");
const dependencies = packageJson.dependencies as Json;
for (const [name, version] of Object.entries({ "@modelcontextprotocol/sdk": "1.30.0", zod: "4.6.5" })) if (dependencies[name] !== version) throw new Error(`${name} must be pinned to ${version}`);
const devDependencies = packageJson.devDependencies as Json;
for (const [name, version] of Object.entries({ "openapi-typescript": "7.13.0", "json-schema-to-zod": "2.8.1", yaml: "2.9.1" })) if (devDependencies[name] !== version) throw new Error(`${name} must be pinned to ${version}`);
console.error("Plugin manifests valid");

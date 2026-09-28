# @jurislm/hetzner-plugin

Local stdio MCP plugin for Hetzner Cloud and Storage Box. It registers generated `hetzner_cloud_*` and `hetzner_unified_*` tools from the committed official OpenAPI snapshots, plus focused tools for servers, SSH keys, volumes, reference data, Storage Boxes, metrics, and server RAM over SSH.

## Scope

This plugin is designed for local MCP hosts through stdio only. It does not provide a remote MCP endpoint or OAuth, and submission to the public OpenAI Plugins Directory is outside this repository's scope. Publishing the package on npm and GitHub does not make it a public-directory plugin.

## Requirements

- Bun 1.1 or later
- A Hetzner project API token

Set `HETZNER_API_TOKEN` in the MCP host's environment:

```sh
export HETZNER_API_TOKEN="your-project-api-token"
```

The same token is sent to both the Cloud and Unified APIs. Hetzner tokens are project-bound, so this plugin accesses resources in the token's project.

To use `hetzner_get_server_ram`, the server needs a reachable public IPv4 and `free`; the local host needs `ssh` and a private key available through `ssh-agent` or `~/.ssh`. Fingerprint verification also requires `ssh-keyscan` and `ssh-keygen`.

## Install

### Codex CLI

Use the repository root as the marketplace source and leave the sparse path empty. The supported manifest is `.agents/plugins/marketplace.json`:

```sh
codex plugin marketplace add https://github.com/jurislm/hetzner-plugin
codex plugin add hetzner-plugin@hetzner-marketplace
```

### Codex desktop on macOS

When Codex starts from the Dock or Finder, it does not read `~/.zshenv` or `~/.zshrc`. A token exported only by zsh is then absent from the bundled MCP process. To use a token already exported by `~/.zshenv`, keep the plugin installed and place this local override in `~/.codex/config.toml`:

```toml
[plugins."hetzner-plugin@hetzner-marketplace".mcp_servers.hetzner]
enabled = false

[mcp_servers.hetzner]
command = "/bin/zsh"
args = ["-c", "exec bunx -y @jurislm/hetzner-plugin@latest"]
enabled_tools = ["hetzner_cloud_list_servers", "hetzner_unified_list_storage_boxes", "hetzner_assert_storage_box_space"]
startup_timeout_sec = 30
```

This launches the same published plugin through zsh without copying the token into the config file. The tool allowlist covers read-only acceptance. Check `codex mcp get hetzner`, then start a new Codex chat and call both list tools. Record the resolved package version, HTTP status, and returned counts. A registered tool alone does not establish API access: a missing tool means discovery did not reach the chat, `HETZNER_API_TOKEN is required` means the MCP process lacks the token, and HTTP 401 means Hetzner rejected it.

### Other MCP hosts

Use the published-package stdio configuration in [`mcp.json`](mcp.json). The host must pass `HETZNER_API_TOKEN` to the `bunx` process. The server has no remote endpoint or OAuth flow.

## OpenAPI tools

`openapi/hetzner-cloud-openapi.json` and `openapi/hetzner-unified-openapi.json` are the committed upstream snapshots. [`api/manifest.json`](api/manifest.json) records their source URLs, fetch times, hashes, and operation counts. The generated catalogs are combined with focused tools for server, SSH key, reference data, volume, and Storage Box management; Storage Box capacity checks; server CPU, disk, and network metrics; and RAM queries over SSH.

Update and validate the snapshots with:

```sh
bun run api:fetch
bun run api:generate
bun run api:check
```

`api:fetch` downloads the current specifications, `api:generate` builds TypeScript and MCP operation definitions from the committed snapshots, and `api:check` verifies the local snapshots and generated files.

## Development

```sh
bun install --frozen-lockfile
bun run check
```

`bun run check` runs manifest validation, OpenAPI drift checks, lint, typecheck, build, tests, release checks, and package checks.

## License

MIT

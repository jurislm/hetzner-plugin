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

Read resource state before write operations. Some operations create billable resources or modify or delete live resources. Treat one-time credentials returned by explicit actions as secrets.

To use `hetzner_get_server_ram`, the server needs a reachable public IPv4 and `free`; the local host needs `ssh` and a private key available through `ssh-agent` or `~/.ssh`. Fingerprint verification also requires `ssh-keyscan` and `ssh-keygen`.

## Install

### Codex CLI

Use the repository root as the marketplace source and leave the sparse path empty. The supported manifest is `.agents/plugins/marketplace.json`:

```sh
codex plugin marketplace add https://github.com/jurislm/hetzner-plugin
codex plugin add hetzner-plugin@hetzner-marketplace
```

### Codex desktop on macOS

A Codex process launched from the Dock or Finder does not read zsh startup files. If your token is exported by `~/.zshenv`, copy [`launchers/hetzner-desktop.zsh`](launchers/hetzner-desktop.zsh) to `~/.codex/bin/hetzner-mcp.zsh`, then add this override to `~/.codex/config.toml`:

```toml
[plugins."hetzner-plugin@hetzner-marketplace".mcp_servers.hetzner]
enabled = false

[mcp_servers.hetzner]
command = "/bin/zsh"
args = ["-f", "-c", 'source "$HOME/.codex/bin/hetzner-mcp.zsh"']
startup_timeout_sec = 30
```

The `-f` option disables automatic user startup-file loading. The launcher explicitly sources `${ZDOTDIR:-$HOME}/.zshenv` with stdout suppressed and stderr retained, so startup banners cannot corrupt MCP protocol frames. It uses the existing token without storing its value in Codex config. It removes other exported variables, retaining only `HETZNER_API_TOKEN`, `HOME`, `PATH`, `TMPDIR`, `LANG`, and `SSH_AUTH_SOCK` for the supported SSH-agent tools, and uses `$HOME/.bun/bin/bunx` with a fixed Bun/system PATH. Adjust the Bun path in the copied launcher if necessary. The portable plugin registration remains available for hosts that already provide the token.

Check `codex mcp get hetzner`, then restart Codex and open a new chat. Verify actual tool availability and call `hetzner_cloud_list_servers` and `hetzner_unified_list_storage_boxes`. Record the resolved package version, HTTP status, and returned counts. A successful standalone stdio probe does not establish tool registration in an existing chat. Missing-token errors indicate a startup environment problem; HTTP 401 indicates Hetzner rejected the token.

### Cursor

The repository includes Cursor marketplace and plugin manifests in [`.cursor-plugin/marketplace.json`](.cursor-plugin/marketplace.json) and [`.cursor-plugin/plugin.json`](.cursor-plugin/plugin.json). Add this repository as a marketplace in Cursor, then install `hetzner-plugin`.

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

# @jurislm/hetzner-plugin

Local stdio MCP plugin for Hetzner Cloud and Storage Box. It registers generated `hetzner_cloud_*` and `hetzner_unified_*` tools from the committed official OpenAPI snapshots, plus focused tools for servers, SSH keys, volumes, reference data, Storage Boxes, metrics, and server RAM over SSH.

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

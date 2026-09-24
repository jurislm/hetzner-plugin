# @jurislm/hetzner-plugin

Portable local-stdio MCP plugin for Hetzner Cloud and Storage Box APIs. The `hetzner_cloud_*` and `hetzner_unified_*` catalogs are generated from committed official OpenAPI snapshots; existing focused server, SSH key, volume, Storage Box, storage-stat/space assertion, and server-RAM-over-SSH tools remain available.

## Configure

```sh
export HETZNER_API_TOKEN=account-api-token
bun install --frozen-lockfile
bun run check
```

`HETZNER_API_TOKEN` is the only credential variable. The same token is used for Cloud and Storage Box API requests.

`mcp.json` and `.mcp.json` use the same published-package `bunx` stdio registration as the Woodpecker CI plugin. There is no remote MCP endpoint or OAuth flow.

For Codex repository marketplace installation, use the repository root and leave the sparse path empty. The supported marketplace manifest is `.agents/plugins/marketplace.json`; do not enter `plugins/codex`.

```sh
codex plugin marketplace add https://github.com/jurislm/hetzner-plugin
codex plugin add hetzner-plugin@hetzner-marketplace
```

## OpenAPI contract

`openapi/hetzner-cloud-openapi.json` and `openapi/hetzner-unified-openapi.json` are official snapshots. `api/manifest.json` is the single canonical manifest recording source URL, fetch time, SHA-256, OpenAPI version, path count, and operation count.

```sh
bun run api:fetch
bun run api:generate
bun run api:check
```

## License

MIT

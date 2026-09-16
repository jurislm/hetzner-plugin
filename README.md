# @jurislm/hetzner-plugin

Portable local-stdio MCP plugin for Hetzner Cloud and Storage Box APIs. The `hetzner_cloud_*` and `hetzner_unified_*` catalogs are generated from committed official OpenAPI snapshots; existing focused server, SSH key, volume, Storage Box, storage-stat/space assertion, and server-RAM-over-SSH tools remain available.

## Configure

```sh
export HETZNER_API_TOKEN=cloud-project-token
# Required only when invoking Storage Box tools:
export HETZNER_API_TOKEN_UNIFIED=unified-account-token
bun install --frozen-lockfile
bun run check
```

`mcp.json` registers only a local stdio process. There is no remote MCP endpoint, OAuth flow, axios dependency, or token fallback.

## OpenAPI contract

`openapi/hetzner-cloud-openapi.json` and `openapi/hetzner-unified-openapi.json` are official snapshots. `openapi/manifest.json` records source URL, fetch time, SHA-256, OpenAPI version, path count, and operation count.

```sh
bun run api:fetch
bun run api:generate
bun run api:check
```

## License

MIT

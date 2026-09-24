請使用繁體中文回覆所有問題與建議。

# Copilot Instructions for hetzner-plugin

`@jurislm/hetzner-plugin` is a public TypeScript/Bun local-stdio MCP plugin. It exposes generated `hetzner_cloud_*` and `hetzner_unified_*` tools plus retained focused tools for servers, SSH keys, volumes, Storage Boxes, metrics, and RAM-over-SSH.

## Build and check

```bash
bun install --frozen-lockfile
bun run check
bun run build
bun test
```

The Bun test root is `src/`. `bun run check` verifies the offline API manifest, generated artifacts, plugin manifests, typecheck, build, tests, package contents, and npm pack dry-run. The stdio test launches the already-built `dist/index.js` from `mcp.json`.

## API and credentials

- Cloud and Storage Box operations use the single `HETZNER_API_TOKEN` variable. API access is limited to the token's project; tests must not require live credentials.
- Native `fetch` is the only HTTP client. Keep logs on stderr because stdout is reserved for MCP frames.

## Source and generated contract

- `src/client.ts` owns native-fetch request construction, timeout, decoding, envelopes, and redaction.
- `src/api.ts` adapts retained tools to the shared client.
- `src/tools/` contains retained focused tool registrations.
- `src/generated/operations.ts` and generated API types come only from committed OpenAPI snapshots.
- `openapi/` contains snapshots; `api/manifest.json` is the single canonical provenance manifest.

## CI and release

CI and release are Woodpecker-only:

- `.woodpecker/ci.yml` runs the check gate on push and pull request.
- `.woodpecker/release.yml` verifies `CI_COMMIT_TAG` against `package.json`, then publishes with the `npm_token` secret using `bun publish --access public`.

Keep CI and release Woodpecker-only; do not add remote MCP, OAuth, hosting, or unrelated provider workflows. Do not manually bump the package version.

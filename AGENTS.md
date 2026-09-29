# Repository Instructions

## Scope and safety

- This repository builds a Bun/TypeScript MCP server that uses local stdio for the Hetzner Cloud and Unified APIs.
- Keep changes within the local stdio scope unless the task explicitly expands it.
- Reserve stdout for MCP protocol frames; write diagnostics to stderr.
- Use `HETZNER_API_TOKEN` for both APIs. Never expose the token or unrelated secrets.
- Keep tests offline. Use injected or mocked fetch implementations instead of live Hetzner credentials.

## Sources of truth

- Read source code and checked-in manifests before documenting tools or installation paths.
- `openapi/*.json` are the committed API snapshots; `api/manifest.json` records their provenance. Refresh snapshots with `bun run api:fetch`, regenerate with `bun run api:generate`, and do not edit `src/generated/` by hand.
- `src/tools/` contains retained tool implementations; `src/generated/` contains generated API operations and types.
- `package.json` defines the available scripts and package requirements.
- `.woodpecker/` contains the CI and release workflows. Release Please manages package versions; do not update version fields by hand.
- Use `CLAUDE.md` as an architecture reference and confirm details against the source.

## Changes and verification

- Do not add comments to code.
- Install dependencies with `bun install --frozen-lockfile`.
- When verification is requested, `bun run check` is the full project check. Use `bun run api:check` for API snapshot or generated-contract changes.

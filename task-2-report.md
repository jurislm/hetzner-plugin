# Task 2 — Hetzner plugin report

## Result

Implemented `@jurislm/hetzner-plugin@0.1.0` on `codex/hetzner-plugin`, from `hetzner-mcp` v1.5.0 (`7c99e1e`). The package is public, Bun-only (`>=1.1.0`), local-stdio-only, and uses native `fetch`; axios was removed.

Cloud startup requires `HETZNER_API_TOKEN`. `HETZNER_API_TOKEN_UNIFIED` is checked only before a Unified/Storage Box request; there is no fallback between tokens.

## OpenAPI provenance

| API | Source | Fetched UTC | SHA-256 | OpenAPI | Paths | Operations |
| --- | --- | --- | --- | --- | ---: | ---: |
| Cloud | `https://docs.hetzner.cloud/cloud.spec.json` | 2026-09-16T09:14:21.339Z | `e886b44dd817012d10cbfb72ec62ec56166805e611c350711ac8a9bd207363bb` | 3.1.2 | 152 | 190 |
| Unified | `https://docs.hetzner.cloud/hetzner.spec.json` | 2026-09-16T09:14:21.562Z | `0afcd318330d18896104f6f99459e41692956665ce45c11b8b304391a651e0f8` | 3.1.2 | 23 | 32 |

`scripts/generate-openapi.ts` consumes only the committed snapshots, generates Cloud/Unified TypeScript contracts and a 222-operation shared registry, source-prefixes names deterministically, and throws on a remaining name collision. `api:check` is offline.

## Changed files

- Packaging and plugin registration: `package.json`, `bun.lock`, `plugin.json`, `mcp.json`, `.mcp.json`, `.mcp.json.example`, `.app.json.example`, `.codex-plugin/plugin.json`, `.gitignore`, `README.md`, `LICENSE`.
- OpenAPI: `openapi/hetzner-cloud-openapi.json`, `openapi/hetzner-unified-openapi.json`, `openapi/manifest.json`, `scripts/update-openapi.ts`, `scripts/generate-openapi.ts`.
- Runtime: `src/config.ts`, `src/client.ts`, `src/api.ts`, `src/errors.ts`, `src/server.ts`, `src/index.ts`, `src/stream.ts`, `src/transports/stdio.ts`, `src/generated/hetzner-cloud-api.ts`, `src/generated/hetzner-unified-api.ts`, `src/generated/operations.ts`, `tsconfig.json`.
- Tests: `src/config.test.ts`, `src/client.test.ts`, `src/generated-contract.test.ts`, `src/server.test.ts`, `src/stdio-protocol.test.ts`.
- Distribution/operations: `skills/hetzner/SKILL.md`, `skills/hetzner/references/authentication.md`, `.woodpecker/ci.yml`, `.woodpecker/release.yml`, `scripts/validate-plugin-manifests.ts`, `scripts/package-contents-check.ts`.

Existing v1.5 focused capabilities remain registered through the common envelope/annotation adapter: Cloud servers, SSH keys, volumes, reference/metrics, unified Storage Boxes, Storage Box stats/space assertion, and explicit server-RAM-over-SSH.

## Verification

| Command | Exit | Evidence |
| --- | ---: | --- |
| `bun install` | 0 | Exact requested shared pins installed. |
| `bun run api:fetch` | 0 | Two official snapshots and manifest written. |
| `bun run api:generate` | 0 | 222 operations generated. |
| `bun run api:check` | 0 | Regeneration caused no diff in tracked snapshot/generated artifacts. |
| `bun run manifest:check` | 0 | Portable/root/fallback manifests, local stdio boundary, public package, and exact pins validated. |
| `bun run typecheck` | 0 | TypeScript source check passed. |
| `bun test src` | 0 | 10 passing tests, 31 assertions. |
| `bun run build` | 0 | `dist` emitted. |
| `npm pack --dry-run` | 0 | 94 packaged files; required artifacts included. |
| `bun run package:check` | 0 | Required package contents present; credential-file paths rejected. |
| `git diff --check` | 0 | No whitespace errors. |

TDD evidence: config and client tests were run failing before their implementations. The client tests cover token timing/no fallback, auth selection, path/query/body encoding, JSON/text/binary/204, timeout, no retry, errors, and redaction. Server tests cover generated metadata/annotations, structured ToolEnvelope output, preserved focused tool registration, and local stdio against built `dist`.

## Unresolved concerns

- No live Hetzner request was made: no credentials were used or available for provider acceptance. The completed tests use injected local fetch responses and the local stdio process only.
- The retained v1.5 `tests/` suite uses Vitest-specific mocks and is not compatible with Bun's test runner; canonical `bun test` runs the new `src/` Bun suite. Migrating those historical unit tests is follow-up work, not evidence that their old runner passed.

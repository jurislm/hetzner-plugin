# Task 2 — Hetzner plugin report

## Result

Implemented `@jurislm/hetzner-plugin@0.1.0` on `codex/hetzner-plugin`, from `hetzner-mcp` v1.5.0 (`7c99e1e`). The package is public, Bun-only (`>=1.1.0`), local-stdio-only, and uses native `fetch`.

Cloud startup requires `HETZNER_API_TOKEN`. `HETZNER_API_TOKEN_UNIFIED` is checked only before a Unified/Storage Box request and is never substituted by the Cloud token.

## OpenAPI provenance

| API | Source | Fetched UTC | SHA-256 | OpenAPI | Paths | Operations |
| --- | --- | --- | --- | --- | ---: | ---: |
| Cloud | `https://docs.hetzner.cloud/cloud.spec.json` | 2026-09-16T09:33:48.395Z | `3a482a15e70b065ec06857e86435313eb0279b33c1b14496f2b16d55f9447ceb` | 3.1.2 | 152 | 190 |
| Unified | `https://docs.hetzner.cloud/hetzner.spec.json` | 2026-09-16T09:33:48.618Z | `13e177935c03b020b7f054ff1b257297aa534d6d7b5df768af06d9ccf55a4b46` | 3.1.2 | 23 | 32 |

`scripts/update-openapi.ts` normalizes a final newline before both writing and hashing each snapshot. `scripts/check-openapi.ts` recalculates both committed snapshot hashes offline before generation. `scripts/generate-openapi.ts` consumes only committed snapshots, generates Cloud/Unified TypeScript contracts and a 222-operation shared registry, source-prefixes names deterministically, and throws on a remaining name collision.

## Changed files

- Packaging and plugin registration: `package.json`, `bun.lock`, `plugin.json`, `mcp.json`, `.mcp.json`, `.mcp.json.example`, `.app.json.example`, `.codex-plugin/plugin.json`, `.gitignore`, `README.md`, `LICENSE`, `CHANGELOG.md`.
- OpenAPI: `openapi/hetzner-cloud-openapi.json`, `openapi/hetzner-unified-openapi.json`, `openapi/manifest.json`, `scripts/update-openapi.ts`, `scripts/check-openapi.ts`, `scripts/generate-openapi.ts`, `src/openapi-integrity.ts`.
- Runtime: `src/config.ts`, `src/client.ts`, `src/api.ts`, `src/errors.ts`, `src/server.ts`, `src/index.ts`, `src/stream.ts`, `src/transports/stdio.ts`, `src/generated/hetzner-cloud-api.ts`, `src/generated/hetzner-unified-api.ts`, `src/generated/operations.ts`, `tsconfig.json`.
- Tests: `bunfig.toml`, `src/config.test.ts`, `src/client.test.ts`, `src/generated-contract.test.ts`, `src/openapi-integrity.test.ts`, `src/retained-capabilities.test.ts`, `src/server.test.ts`, `src/stdio-protocol.test.ts`; removed obsolete root `tests/` Vitest suite.
- Active documentation: `CLAUDE.md`, `openspec/config.yaml`, `openspec/changes/storage-boxes-review-fixes/{design.md,proposal.md,specs/storage-boxes/spec.md,tasks.md}`, `openspec/specs/storage-boxes.md`, `skills/hetzner/references/authentication.md`.
- Distribution/operations: `skills/hetzner/SKILL.md`, `skills/hetzner/references/authentication.md`, `.woodpecker/ci.yml`, `.woodpecker/release.yml`, `scripts/validate-plugin-manifests.ts`, `scripts/package-contents-check.ts`.

Existing v1.5 focused capabilities remain registered through the common envelope/annotation adapter: Cloud servers, SSH keys, volumes, reference/metrics, unified Storage Boxes, Storage Box stats/space assertion, and explicit server-RAM-over-SSH.

## Verification

| Command | Exit | Evidence |
| --- | ---: | --- |
| `bun install` | 0 | Exact requested shared pins installed. |
| `bun run api:fetch` | 0 | Two official snapshots and manifest written. |
| `bun run api:generate` | 0 | 222 operations generated. |
| `bun run api:check` | 0 | Offline hash verification passed for both snapshots, then regeneration caused no diff in tracked snapshot/generated artifacts. |
| `bun run manifest:check` | 0 | Portable/root/compatibility manifests, local stdio boundary, public package, and exact pins validated. |
| `bun run typecheck` | 0 | TypeScript source check passed. |
| `bun run clean && bun run build && bun test` | 0 | Already-built `dist/index.js` served stdio; 17 passing Bun tests, 50 assertions. |
| `bun run build` | 0 | `dist` emitted. |
| `npm pack --dry-run` | 0 | Fresh output contained 98 packaged files (`jurislm-hetzner-plugin-0.1.0.tgz`, package size 542,554 bytes, unpacked size 9,040,320 bytes); required artifacts included. |
| `bun run package:check` | 0 | Required package contents present; credential-file paths rejected. |
| `git diff --check` | 0 | No whitespace errors. |

## Fix round 1 and round 2 evidence

- Snapshot hashes now cover exactly the bytes persisted to disk, including an appended final newline. The Bun regression suite verifies the live committed manifest and rejects a tampered offline fixture.
- `formatToolError` and `redactErrorText` centralize generated and retained error output. The server regression test injects both bearer tokens into provider errors and verifies neither appears in either generated or retained tool output.
- Active Bun tests exercise retained `hetzner_get_storage_box_stats`, `hetzner_assert_storage_box_space`, `hetzner_get_server_ram`, and `hetzner_create_server` method/path/body/annotation behavior through injected request boundaries. `bunfig.toml` explicitly sets the test root to `src`; canonical `bun test` therefore includes those retained tests instead of relying on an ignored legacy suite.
- `check` builds before testing. The stdio test launches the `dist/index.js` declared by `mcp.json` without performing its own build.
- `CLAUDE.md` and OpenSpec now describe `HETZNER_API_TOKEN_UNIFIED` as lazy-required immediately before a Storage Box operation; a Cloud token is never substituted.
- Round 2 removed the obsolete root `tests/` suite and all active axios/legacy-token references while preserving `openspec/changes/archive/` unchanged. The checked-in `bunfig.toml` test root is `src`, so direct `bun test` exercises the active retained-capability tests.
- Fresh package readback reports exactly 98 files; the stale 94-file value is removed.

## Unresolved concerns

- No live Hetzner request was made: no credentials were used or available for provider acceptance. The completed tests use injected local fetch responses and the local stdio process only.
- The archived OpenSpec history under `openspec/changes/archive/` was preserved unchanged.

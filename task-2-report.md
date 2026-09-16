# Task 2 — Hetzner plugin report

## Result

Implemented `@jurislm/hetzner-plugin@0.1.0` on `codex/hetzner-plugin`, final public `main` at `61a80503ab650e8dd6c138159c2782ad7ca0d483`, starting from the v1.5.0 baseline (`7c99e1e`). The package is public, Bun-only (`>=1.1.0`), local-stdio-only, and uses native `fetch`.

Cloud startup requires `HETZNER_API_TOKEN`. `HETZNER_API_TOKEN_UNIFIED` is checked only before a Unified/Storage Box request and is never substituted by the Cloud token.

## OpenAPI provenance

| API | Source | Fetched UTC | SHA-256 | OpenAPI | Paths | Operations |
| --- | --- | --- | --- | --- | ---: | ---: |
| Cloud | `https://docs.hetzner.cloud/cloud.spec.json` | 2026-09-16T09:33:48.395Z | `3a482a15e70b065ec06857e86435313eb0279b33c1b14496f2b16d55f9447ceb` | 3.1.2 | 152 | 190 |
| Unified | `https://docs.hetzner.cloud/hetzner.spec.json` | 2026-09-16T09:33:48.618Z | `13e177935c03b020b7f054ff1b257297aa534d6d7b5df768af06d9ccf55a4b46` | 3.1.2 | 23 | 32 |

`scripts/update-openapi.ts` normalizes a final newline before both writing and hashing each snapshot. `scripts/check-openapi.ts` recalculates both committed snapshot hashes offline before generation. `scripts/generate-openapi.ts` consumes only committed snapshots, generates Cloud/Unified TypeScript contracts and a 222-operation shared registry, source-prefixes names deterministically, and throws on a remaining name collision.

## Changed files

- Packaging and plugin registration: `package.json`, `bun.lock`, `.release-please-manifest.json`, `plugin.json`, `mcp.json`, `.mcp.json`, `.mcp.json.example`, `.app.json.example`, `.codex-plugin/plugin.json`, `.gitignore`, `README.md`, `LICENSE`, `CHANGELOG.md`.
- OpenAPI: `openapi/hetzner-cloud-openapi.json`, `openapi/hetzner-unified-openapi.json`, `api/manifest.json`, `scripts/update-openapi.ts`, `scripts/check-openapi.ts`, `scripts/check-release-tag.ts`, `scripts/generate-openapi.ts`, `src/openapi-integrity.ts`.
- Runtime: `src/config.ts`, `src/client.ts`, `src/api.ts`, `src/errors.ts`, `src/server.ts`, `src/index.ts`, `src/stream.ts`, `src/transports/stdio.ts`, retained registrar files under `src/tools/`, `src/generated/hetzner-cloud-api.ts`, `src/generated/hetzner-unified-api.ts`, `src/generated/operations.ts`, `tsconfig.json`.
- Tests: `bunfig.toml`, `src/config.test.ts`, `src/client.test.ts`, `src/generated-contract.test.ts`, `src/openapi-integrity.test.ts`, `src/package-contents.test.ts`, `src/release-tag.test.ts`, `src/retained-capabilities.test.ts`, `src/server.test.ts`, `src/stdio-protocol.test.ts`; removed obsolete root test suite and `vitest.config.ts`.
- CI: removed `.github/workflows/ci.yml` and `.github/workflows/release.yml`; `.woodpecker/ci.yml` and `.woodpecker/release.yml` are the remaining CI/release definitions.
- Active documentation: `CLAUDE.md`, `.github/copilot-instructions.md`, `docs/index.html`, `openspec/config.yaml`, `openspec/specs/{overview.md,storage-boxes.md}`, active OpenSpec change records, `skills/hetzner/references/authentication.md`.
- Distribution/operations: `skills/hetzner/SKILL.md`, `skills/hetzner/references/authentication.md`, `.woodpecker/ci.yml`, `.woodpecker/release.yml`, `scripts/validate-plugin-manifests.ts`, `scripts/package-contents.ts`, `scripts/package-contents-check.ts`.

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
| `bun run clean && bun run build && bun test` | 0 | Already-built `dist/index.js` served stdio; 23 passing Bun tests, 65 assertions. |
| `bun run build` | 0 | `dist` emitted. |
| `bun run check` | 0 | Full manifest, typecheck, build-before-test, active Bun test, package check, and Bun pack gate passed; 23 tests and 65 assertions passed. |
| `bun pm pack --dry-run` | 0 | Fresh Bun output contained 98 files and 9.0MB unpacked size. |
| `bun run package:check` | 0 | Required package contents present; credential-file paths rejected. |
| `git diff --check` | 0 | No whitespace errors. |

## Fix round 1, round 2, round 3, round 4, round 5, and round 7 evidence

- Snapshot hashes now cover exactly the bytes persisted to disk, including an appended final newline. The Bun regression suite verifies the live committed manifest and rejects a tampered offline fixture.
- `formatToolError` and `redactErrorText` centralize generated and retained error output. The server regression test injects both bearer tokens into provider errors and verifies neither appears in either generated or retained tool output.
- Active Bun tests exercise retained `hetzner_get_storage_box_stats`, `hetzner_assert_storage_box_space`, `hetzner_get_server_ram`, and `hetzner_create_server` method/path/body/annotation behavior through injected request boundaries. `bunfig.toml` explicitly sets the test root to `src`; canonical `bun test` therefore includes those retained tests instead of relying on an ignored legacy suite.
- `check` builds before testing. The stdio test launches the `dist/index.js` declared by `mcp.json` without performing its own build.
- `CLAUDE.md` and OpenSpec now describe `HETZNER_API_TOKEN_UNIFIED` as lazy-required immediately before a Storage Box operation; a Cloud token is never substituted.
- Round 2 removed the obsolete root test suite and all active former-client/legacy-token references while preserving `openspec/changes/archive/` unchanged. The checked-in `bunfig.toml` test root is `src`, so direct `bun test` exercises the active retained-capability tests.
- Fresh package readback reports exactly 98 files; the stale 94-file value is removed.
- Round 3 changed `.codex-plugin/plugin.json` to describe the Codex compatibility manifest while keeping the root portable manifest canonical, and deleted the obsolete root runner config.
- Round 4 updated the active `test-infrastructure` OpenSpec spec to the implemented Bun `src` test root and build-before-test flow, removed obsolete workflow files, and preserved archived OpenSpec history.
- Round 5 added the Woodpecker Alpine git prerequisite, tag/version verification, public npm release job, `publishConfig.access=public`, and npm pack coverage in `check`. The canonical manifest is now `api/manifest.json`; `openapi/` contains snapshots only.
- Round 5 fresh pack readback and command evidence are recorded after the canonical manifest migration; no publish or provider verification was performed.
- Retained injection refactor: every registrar accepts an `ApiRequest`; `createServer` builds Cloud/Unified requests from its config and injected fetch; pagination factories are registrar-local; retained requests no longer load process config or global fetch. The no-process-credentials `createServer` regression passes.
- Round 7 replaced the package checker’s npm subprocess with Bun’s `bun pm pack --dry-run` output parser and kept required-file, exact-one-manifest, and credential-file checks.
- Generated handlers now parse `operation.responseSchema` before returning structured content; malformed provider responses return redacted `isError`. Generated destructive metadata covers poweroff, reboot, rebuild, shutdown, rollback, delete/remove/destroy, reset, and revoke patterns.
- `.release-please-manifest.json` is aligned to `0.1.0`; active OpenSpec, CLAUDE, Copilot, landing page, and API reference text now describe `@jurislm/hetzner-plugin`, Bun/`src`, `.woodpecker`, 264 total tools (222 generated + 42 retained), and the Unified auth variable.

## Final readback

- Fresh `bun run check`: exit 0, 23 tests/65 assertions; official plugin validator: exit 0; GitHub readback: `jurislm/hetzner-plugin` PUBLIC, `main` at the same SHA.
- Codex local marketplace install/readback: `hetzner-plugin@jurislm-local`, version `0.1.0`, installed manifest and `mcp.json` present in local cache.
- NPM publish remains blocked by `npm whoami` E401; package readback is E404. No publish or legacy deprecation was attempted.

## Release automation alignment

- Main push: `.woodpecker/release.yml` runs Release Please GitHub Release then Release PR; `.woodpecker/release-pr-auto-merge.yml` serializes and validates the Release PR before merge.
- Tag push: `.woodpecker/npm-release.yml` verifies `v<package.version>` and runs Bun-native pack before token-scoped public publish.
- `release-please-config.json` synchronizes `package.json`, `plugin.json`, and `.codex-plugin/plugin.json`; local release workflow tests are included in `bun run check`.

## Unresolved concerns

- No live Hetzner request was made: no credentials were used or available for provider acceptance. The completed tests use injected local fetch responses and the local stdio process only.
- The archived OpenSpec history under `openspec/changes/archive/` was preserved unchanged.
- No publish verification was performed.

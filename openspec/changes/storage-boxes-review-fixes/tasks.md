## 1. Credential and request boundary

- [x] 1.1 Require `HETZNER_API_TOKEN` at process startup.
- [x] 1.2 Require `HETZNER_API_TOKEN_UNIFIED` immediately before Unified Storage Box requests; keep Cloud and Unified credentials separate.
- [x] 1.3 Use native `fetch` for auth, path/query/body encoding, JSON/text/binary/204 decoding, timeout, and zero retries.
- [x] 1.4 Centralize error formatting and redact configured tokens plus bearer-token values in generated and retained tool errors.
- [x] 1.5 Add active Bun tests for config, client, error redaction, and retained API seams under `src/`.

## 2. OpenAPI contract

- [x] 2.1 Commit the official Cloud and Unified OpenAPI snapshots and provenance manifest.
- [x] 2.2 Hash the exact persisted snapshot bytes, including the final newline written to disk.
- [x] 2.3 Verify both snapshot hashes offline in `api:check` before regenerating artifacts.
- [x] 2.4 Generate Cloud/Unified TypeScript contracts and one source-prefixed operation registry; fail on any remaining name collision.

## 3. Retained capability coverage

- [x] 3.1 Keep Storage Box statistics and assert-space tools registered and test their responses and annotations.
- [x] 3.2 Keep explicit server RAM-over-SSH behavior and test server resolution plus SSH output parsing.
- [x] 3.3 Test a representative retained server resource method, path, request body, and mutation annotations.
- [x] 3.4 Keep generated metadata, structured `ToolEnvelope`, and all retained tool registrations on the same MCP server contract.

## 4. Packaging and documentation

- [x] 4.1 Use the portable root plugin manifest, local stdio MCP manifest, compatibility Codex manifest, examples, skill, references, README, LICENSE, and Woodpecker CI/release files.
- [x] 4.2 Document Cloud startup credentials and lazy Unified Storage Box credentials in active README, `CLAUDE.md`, and OpenSpec artifacts.
- [x] 4.3 Remove obsolete root test artifacts; keep active retained behavior tests under `src/`.

## 5. Validation

- [x] 5.1 Build before running the canonical `bun test`; stdio tests launch the already-built `dist/index.js` from `mcp.json`.
- [x] 5.2 Run `bun run check`, `bun run build`, `bun pm pack --dry-run`, and `git diff --check`.
- [x] 5.3 Do not claim live Hetzner acceptance without provider credentials.

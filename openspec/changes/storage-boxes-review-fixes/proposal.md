## Why

The active Hetzner plugin has two API credential classes and two provider contracts. Cloud operations use `HETZNER_API_TOKEN`; Storage Box operations use `HETZNER_API_TOKEN_UNIFIED`. The boundary must stay explicit while allowing a Cloud-only process to start.

The plugin also needs a reproducible native-fetch client, generated contract coverage, deterministic Storage Box capacity checks, and active Bun coverage for retained v1.5 operations.

## What Changes

- Require `HETZNER_API_TOKEN` at startup.
- Require `HETZNER_API_TOKEN_UNIFIED` only immediately before a Unified Storage Box request; never use one token class for the other.
- Use native `fetch` for Cloud and Unified requests with shared timeout, response decoding, envelope, annotation, and error-redaction contracts.
- Generate operations from committed official OpenAPI snapshots and verify their persisted-byte hashes offline.
- Keep Storage Box stats, assert-space, RAM-over-SSH, server, SSH key, volume, reference, and metrics tools registered through the common server contract.
- Run active Bun tests from `src/`, including retained capability method/path/body/annotation coverage.

## Capabilities

### Modified Capabilities

- `storage-boxes`: explicit Unified credential boundary, native-fetch request path, stats and space assertions.
- `servers`: native-fetch retained resource operations and RAM-over-SSH Cloud lookup.
- `test-infrastructure`: active Bun test root and build-before-test check ordering.

## Impact

- Code: `src/client.ts`, `src/api.ts`, `src/errors.ts`, `src/server.ts`, and retained tool registration seams.
- Tests: active Bun tests under `src/`; obsolete root test suite removed.
- Docs: package README, `CLAUDE.md`, and active OpenSpec artifacts use the current token and transport boundary.
- External APIs: no endpoint change; only credential selection and request implementation are standardized.
- Runtime: local stdio only; no live provider acceptance is claimed.

## Context

The active target is `@jurislm/hetzner-plugin`, a local Bun stdio MCP plugin. It exposes generated Cloud and Unified operations plus retained v1.5 focused tools. The Cloud API is `https://api.hetzner.cloud/v1`; the Unified Storage Box API is `https://api.hetzner.com/v1`.

## Goals / Non-Goals

**Goals:**

- Keep `HETZNER_API_TOKEN` as the Cloud credential required at process startup.
- Use `HETZNER_API_TOKEN_UNIFIED` exclusively for Storage Box requests, checking it immediately before the request so Cloud-only users can start.
- Use native `fetch` for both API bases with shared timeout, response decoding, envelope, annotation, and error-redaction behavior.
- Generate the provider contract only from committed authoritative OpenAPI snapshots.
- Keep the retained Storage Box and Cloud-focused tools covered by active Bun tests.

**Non-Goals:**

- No live-provider acceptance in CI or local tests without credentials.
- No remote MCP endpoint, OAuth flow, or alternate credential alias.
- No modification to archived OpenSpec history.

## Decisions

### Decision 1: Separate credentials with lazy Unified validation

Storage Box operations read only `HETZNER_API_TOKEN_UNIFIED`. The process validates `HETZNER_API_TOKEN` during startup. A missing Unified token produces a local error before `fetch` is called. Cloud credentials are never used for Unified requests.

### Decision 2: Native-fetch client boundary

`src/client.ts` owns URL path/query encoding, JSON request bodies, bearer authentication, timeout, no-retry behavior, JSON/text/binary/204 decoding, `ToolEnvelope`, and sensitive-value redaction. `src/api.ts` is the retained-tool adapter over this client. `src/errors.ts` provides the shared error formatter and bearer/token redaction used by generated and retained MCP handlers.

### Decision 3: Generated contract

`openapi/hetzner-cloud-openapi.json` and `openapi/hetzner-unified-openapi.json` are the only codegen inputs. `scripts/update-openapi.ts` records source URL, fetch time, persisted-byte SHA-256, versions, and counts. `scripts/check-openapi.ts` recalculates both snapshot hashes offline before `api:check` regenerates types and the shared operation registry. Names use a source prefix and any remaining collision fails generation.

### Decision 4: Retained capability coverage

Active Bun tests exercise Storage Box statistics, space assertion, RAM-over-SSH, and a representative server resource mutation boundary including method, path, body, and annotations. The direct `bun test` root is `src/`, where these tests are visible to the canonical check.

## Risks / Trade-offs

- Cloud-only users can start the process but cannot use Storage Box tools until an account-level Unified token is configured.
- Generated response schemas describe the provider contract; MCP output validation uses the shared envelope boundary so partial provider fixtures and forward-compatible fields do not block envelope delivery.
- Live provider behavior remains unverified until credentials are supplied.

## Verification

Run `bun run check`. It verifies snapshot hashes and generated artifacts, validates manifests and package contents, typechecks, builds before tests, runs the active Bun suite, and performs the package check.

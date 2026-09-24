## ADDED Requirements

### Requirement: Bun test suite

The repository SHALL use Bun's built-in test runner. The package `test` script SHALL invoke `bun test`, and `bunfig.toml` SHALL set the test root to `src` so active tests are discovered directly.

#### Scenario: Test script available

- **WHEN** a developer runs `bun test` or `bun run test`
- **THEN** Bun runs the active tests under `src` and exits with code 0 when they pass

#### Scenario: Active test root

- **WHEN** the repository test configuration is inspected
- **THEN** `bunfig.toml` points the Bun test root at `./src`, and no root `tests/` suite is required

### Requirement: Build-before-test distribution flow

The canonical `check` script SHALL typecheck and build `dist` before running Bun tests. The stdio protocol test SHALL launch the already-built `dist/index.js` declared by `mcp.json`; it SHALL not build the project itself.

#### Scenario: Clean build then protocol test

- **WHEN** `bun run check` is executed
- **THEN** the build completes before `bun test`, and the stdio test starts the shipped `dist/index.js` through the local stdio configuration

### Requirement: Active retained capability coverage

Active Bun tests SHALL cover Storage Box stats, Storage Box assert-space, RAM-over-SSH, and a representative retained resource method/path/body/annotation boundary.

#### Scenario: Retained capability coverage

- **WHEN** `bun test` runs
- **THEN** the retained capability tests execute under `src` without relying on a removed test framework or live provider credentials

### Requirement: Tests do not require live API credentials

The active test suite MUST use injected local request/SSH boundaries and MUST NOT make provider network calls or require `HETZNER_API_TOKEN` to be set.

#### Scenario: Test run without env

- **WHEN** `bun test` is run with no `HETZNER_*` environment variables
- **THEN** all active tests pass using local fixtures; live provider acceptance remains a separate, credentialed step

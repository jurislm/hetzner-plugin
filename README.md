# @jurislm/hetzner-plugin

Local stdio MCP plugin for Hetzner Cloud and Storage Box. It registers generated `hetzner_cloud_*` and `hetzner_unified_*` tools from the committed official OpenAPI snapshots, plus focused tools for servers, SSH keys, volumes, reference data, Storage Boxes, metrics, and server RAM over SSH.

Follow the shared [JurisLM Plugin Architecture v1](https://github.com/jurislm/woodpecker-ci-plugin/blob/main/docs/plugin-architecture.md) for package, host configuration and acceptance boundaries.

## Scope

This plugin is designed for local MCP hosts through stdio only. It does not provide a remote MCP endpoint or OAuth, and submission to the public OpenAI Plugins Directory is outside this repository's scope. Publishing the package on npm and GitHub does not make it a public-directory plugin.

## Requirements

- Bun 1.1 or later
- A Hetzner project API token

Set `HETZNER_API_TOKEN` in the MCP host's environment:

```sh
export HETZNER_API_TOKEN="your-project-api-token"
```

The native Codex registration forwards `HETZNER_API_TOKEN` from its owning environment. The portable `mcp.json` keeps host-specific fields and credential defaults out of the package. The same token is sent to both the Cloud and Unified APIs. Hetzner tokens are project-bound, so this plugin accesses resources in the token's project.

Read resource state before write operations. Some operations create billable resources or modify or delete live resources. Treat one-time credentials returned by explicit actions as secrets.

To use `hetzner_get_server_ram`, the server needs a reachable public IPv4 and `free`; the local host needs `ssh` and a private key available through `ssh-agent` or `~/.ssh`. Fingerprint verification also requires `ssh-keyscan` and `ssh-keygen`.

## Install

### Codex CLI

Use the repository root as the marketplace source and leave the sparse path empty. The supported manifest is `.agents/plugins/marketplace.json`:

```sh
codex plugin marketplace add https://github.com/jurislm/hetzner-plugin
codex plugin add hetzner-plugin@hetzner-marketplace
```

### Codex desktop on macOS

A Codex process launched from the Dock or Finder does not read zsh startup files. If your token is exported by `~/.zshenv`, copy [`launchers/hetzner-desktop.zsh`](launchers/hetzner-desktop.zsh) to `~/.codex/bin/hetzner-mcp.zsh` and copy `launchers/validate-hetzner-runtime.mjs` beside it after preparing the [installed desktop runtime](#installed-desktop-runtime), then add this override to `~/.codex/config.toml`:

```toml
[plugins."hetzner-plugin@hetzner-marketplace".mcp_servers.hetzner]
enabled = false

[mcp_servers.hetzner]
command = "/bin/zsh"
args = ["-f", "-c", 'source "$HOME/.codex/bin/hetzner-mcp.zsh"']
startup_timeout_sec = 30
```

The `-f` option disables automatic user startup-file loading. The launcher explicitly sources `${ZDOTDIR:-$HOME}/.zshenv` with stdout suppressed and stderr retained, and stops if sourcing fails. Startup banners cannot corrupt MCP protocol frames. It uses the existing token without storing its value in Codex config. It removes other exported variables, retaining only `HETZNER_API_TOKEN`, `HOME`, `PATH`, `TMPDIR`, `LANG`, and `SSH_AUTH_SOCK` for the supported SSH-agent tools, and launches the validated installed entry through `$HOME/.bun/bin/bun --no-env-file --no-install` with a fixed Bun/system PATH. Adjust the Bun path in the copied launcher if necessary. The portable plugin registration remains available for hosts that already provide the token.

Check `codex mcp get hetzner`, then restart Codex and open a new chat. Verify actual tool availability and call `hetzner_cloud_list_servers` and `hetzner_unified_list_storage_boxes`. Record the resolved package version, HTTP status, and returned counts. A successful standalone stdio probe does not establish tool registration in an existing chat. Missing-token errors indicate a startup environment problem; HTTP 401 indicates Hetzner rejected the token.

### Cursor

The repository includes Cursor marketplace and plugin manifests in [`.cursor-plugin/marketplace.json`](.cursor-plugin/marketplace.json) and [`.cursor-plugin/plugin.json`](.cursor-plugin/plugin.json). Add this repository as a marketplace in Cursor, then install `hetzner-plugin`.

### Other MCP hosts

Use the published-package stdio configuration in [`mcp.json`](mcp.json). It launches with `bun x` (not the separate `bunx` executable, which some package-manager shims break). The host should pass `HETZNER_API_TOKEN`; when it is missing, empty, or an unsubstituted `${HETZNER_API_TOKEN}` placeholder, the server reads it from `~/.config/jurislm/plugin.env` (`KEY=value` or `export KEY=value` lines; override the path with `JURISLM_PLUGIN_ENV`). Host values always take precedence. The server has no remote endpoint or OAuth flow.

## OpenAPI tools

`openapi/hetzner-cloud-openapi.json` and `openapi/hetzner-unified-openapi.json` are the committed upstream snapshots. [`api/manifest.json`](api/manifest.json) records their source URLs, fetch times, hashes, and operation counts. The generated catalogs are combined with focused tools for server, SSH key, reference data, volume, and Storage Box management; Storage Box capacity checks; server CPU, disk, and network metrics; and RAM queries over SSH.

Update and validate the snapshots with:

```sh
bun run api:fetch
bun run api:generate
bun run api:check
```

`api:fetch` downloads the current specifications, `api:generate` builds TypeScript and MCP operation definitions from the committed snapshots, and `api:check` verifies the local snapshots and generated files.

## Development

```sh
bun install --frozen-lockfile
bun run check
```

`bun run check` runs manifest validation, OpenAPI drift checks, lint, typecheck, build, tests, release checks, and package checks.

## License

MIT


### Installed desktop runtime

The desktop launcher requires Bun 1.4.3 or newer and a complete normal installation at `~/.local/share/jurislm/mcp/hetzner-plugin`. Copy `launchers/hetzner-desktop.zsh` and its owner-specific `launchers/validate-hetzner-runtime.mjs` together to the same launcher directory. Keep the existing launcher destination and registration; do not change required-server or tool-approval settings.

Prepare each installation or update in a separate staging directory with `bun add --exact @jurislm/hetzner-plugin@<approved-version>`, then verify `bun install --frozen-lockfile`. The installation's `package.json` and `bun.lock` are the only version authority. Startup validates the declared and resolved source, installed identity and binary path, then executes the installed entry with `--no-env-file --no-install`. It never resolves `@latest`, installs dependencies or loads a working-directory `.env`.

For offline recovery, retain a verified released tarball inside the runtime, for example `artifacts/hetzner-plugin-<version>.tgz`, and declare `file:artifacts/hetzner-plugin-<version>.tgz`. A complete same-platform Bun dependency cache, including transitive dependencies, is required; a release tarball alone is insufficient. First run `bun install --offline` to generate the lock, then verify a clean `bun install --offline --frozen-lockfile` rebuild. Existing locked installations use the frozen command directly. Absolute or escaping tarball paths, mutable versions, identity mismatches and tarball SHA512 drift are rejected before startup.

Before selecting a replacement, run the shipped validator against its staging directory with package name `@jurislm/hetzner-plugin` and binary name `hetzner-plugin`, verify published package contents, and perform an offline stdio initialize with dummy credentials. Move the verified complete directory to the runtime path only while this MCP is stopped. Keep the previous installation for rollback. Never copy credentials into the runtime. A successful standalone initialize is not evidence of a desktop reload or provider API access; verify those separately after deployment.

### Removed Cloud response fields

The pinned OpenAPI snapshot predates Hetzner’s [2 November 2026 removal of `deprecated`](https://docs.hetzner.cloud/changelog). `src/removed-response-fields.ts` removes that property from the response validators of the 16 affected Image, Server Type, Load Balancer Type, Load Balancer and Server operations, including nested resources. It does not synthesize values or relax other properties. The `deprecation` fields remain validated and returned. The original generated schemas and snapshot provenance remain unchanged. When refreshing the snapshot past this removal, remove the corresponding compatibility paths; the exhaustive response-schema comparison test detects stale or incomplete coverage.

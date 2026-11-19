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

The repository includes Cursor marketplace and plugin manifests in [`.cursor-plugin/marketplace.json`](.cursor-plugin/marketplace.json) and [`.cursor-plugin/plugin.json`](.cursor-plugin/plugin.json). Add this repository as a marketplace in Cursor, then install `hetzner-plugin`. The Cursor plugin registers its MCP server from [`.cursor-plugin/mcp.json`](.cursor-plugin/mcp.json) and declares `HETZNER_API_TOKEN` as a setup variable, so Cursor passes the token entered on the dashboard at install time. The server reads only that value; when it is empty or still an unsubstituted `${HETZNER_API_TOKEN}` placeholder, tool calls fail with an error asking you to fill `HETZNER_API_TOKEN` in the Cursor dashboard plugin settings.

#### 在 Cursor 管理頁填寫安裝欄位

外掛參數（`HETZNER_API_TOKEN`）改在 Cursor 管理頁 <https://cursor.com/dashboard/plugins> 的安裝欄位（Plugins → Configure）填寫。外掛不再讀取 `~/.config/jurislm/plugin.env` 或其他本機檔案；欄位為空或仍是未代入的 `${HETZNER_API_TOKEN}` 時，呼叫工具會回報「請到 Cursor 管理頁外掛設定填 HETZNER_API_TOKEN」。外掛只在 `.cursor-plugin/plugin.json` 的 `variables` 宣告變數名稱，不含任何值；Cursor 會把你填的值代入 `mcp.json` 裡對應的 `${VAR}` 佔位符。

- 匯入：在管理頁的 Plugins & MCPs 點 Add Marketplace，選 Import from Repo，貼上 `https://github.com/jurislm/hetzner-plugin`，再安裝外掛。
- 欄位範例（假值，請換成自己的）：

  ```text
  HETZNER_API_TOKEN = hetzner-example-token-0000
  ```

驗證方式：

1. 在新對話跑一個唯讀呼叫（例如 list servers 類工具）。回應成功代表值有傳進去；HTTP 401 表示值錯誤或已過期，缺值錯誤表示沒有傳進程序。
2. 也可看新啟動的 MCP 程序的環境變數：值應為實際內容，而不是未代入的 `${VAR}` 佔位符。只檢查長度與是否以 `${` 開頭，不要把值貼到對話、Issue 或 PR。

官方依據：[Cursor Plugins](https://cursor.com/docs/plugins)、[Plugins reference：Variables](https://cursor.com/docs/reference/plugins)。

實測結果（官方文件未載明）：

- 網頁管理頁的介面顯示為「Your Marketplaces」。
- 欄位存好後不會回顯已存的值，確認方式請用下方的驗證。
- 個人方案沒有 Refresh；要更新得先 Remove 再重新匯入。
- 桌面 App 要用 ⌘Q 完全退出再開，才會讀到新值。

### Other MCP hosts

Use the published-package stdio configuration in [`mcp.json`](mcp.json). It launches with `bun x` (not the separate `bunx` executable, which some package-manager shims break). The host must pass `HETZNER_API_TOKEN` in the server process environment. The server reads no local file (`~/.config/jurislm/plugin.env` and `JURISLM_PLUGIN_ENV` are no longer supported); when the variable is missing, empty, or an unsubstituted `${HETZNER_API_TOKEN}` placeholder, tool calls fail with a missing-token error. The server has no remote endpoint or OAuth flow.

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

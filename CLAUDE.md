# CLAUDE.md — JurisLM Hetzner local stdio plugin

`@jurislm/hetzner-plugin` 提供 264 個工具：222 個 OpenAPI generated operations，加上 42 個 retained tools（包含 Storage Box stats/space assertion 與 RAM via SSH）。

## 常用命令

```bash
bun install --frozen-lockfile
bun run api:check    # 離線驗證 committed OpenAPI snapshot 與 generated artifacts
bun run check        # manifest、typecheck、build、Bun tests、package contents
bun test             # Bun test root: src/（含 retained v1.5 capability coverage）

# 本地執行
HETZNER_API_TOKEN="token" bun dist/index.js
```

## Git 分支規範

```
develop → PR → main
```

- 日常開發一律在 `.worktrees/develop` 目錄，不在 main worktree 做 feature commits
- **嚴禁直接 push 到 main**
- 版本號由 Release Please 自動管理，**禁止手動修改 `package.json` 版本號**

## 架構

```
src/
├── index.ts           # MCP server 入口，載入所有 tools
├── api.ts             # Retained tools 的 native-fetch adapter
├── client.ts          # Generated operation native-fetch client
├── server.ts          # Generated/retained tools 的共用 MCP envelope 與 error redaction
├── types.ts           # TypeScript 型別定義
└── tools/
    ├── servers.ts     # 7 個伺服器管理工具
    ├── ssh-keys.ts    # 4 個 SSH 金鑰工具
    ├── reference.ts   # 3 個參考資料工具
    ├── storage-boxes.ts # 20 個 Storage Boxes 工具
    ├── volumes.ts       # 4 個 Cloud Volume 工具
    ├── metrics.ts       # 1 個 Server Metrics 工具
    └── server-ssh.ts    # 1 個 SSH RAM 工具

`openapi/` contains committed API snapshots; `api/manifest.json` is the single canonical provenance manifest.
```

## 工具清單（42 個 retained；另有 222 個 generated，合計 264 個）

### Servers（7 tools）
- `hetzner_list_servers` — 列出專案所有伺服器
- `hetzner_get_server` — 取得單一伺服器詳情（IP、狀態、規格）
- `hetzner_create_server` — 建立新伺服器（**會產生費用**）
- `hetzner_delete_server` — 永久刪除伺服器
- `hetzner_power_on_server` — 啟動已停止的伺服器
- `hetzner_power_off_server` — 強制關機
- `hetzner_reboot_server` — 強制重新開機

### SSH Keys（4 tools）
- `hetzner_list_ssh_keys` — 列出所有 SSH 金鑰
- `hetzner_get_ssh_key` — 取得單一 SSH 金鑰詳情
- `hetzner_create_ssh_key` — 新增 SSH 公鑰
- `hetzner_delete_ssh_key` — 刪除 SSH 金鑰

### Reference（3 tools）
- `hetzner_list_server_types` — 列出可用伺服器規格與定價
- `hetzner_list_images` — 列出可用 OS 映像檔
- `hetzner_list_locations` — 列出可用資料中心位置

### Storage Boxes（22 tools）
- `hetzner_list_storage_boxes` — 列出所有 Storage Box（支援分頁）
- `hetzner_get_storage_box` — 取得單一 Storage Box 詳情（容量、protocols、狀態）
- `hetzner_create_storage_box` — 建立新 Storage Box（**會產生費用**）
- `hetzner_update_storage_box` — 更新 Storage Box 名稱 / labels
- `hetzner_delete_storage_box` — 永久刪除 Storage Box（**destructive**）
- `hetzner_list_storage_box_folders` — 列出 Storage Box 內的資料夾
- `hetzner_list_storage_box_subaccounts` — 列出 Storage Box 的所有子帳號
- `hetzner_create_storage_box_subaccount` — 建立子帳號
- `hetzner_update_storage_box_subaccount` — 更新子帳號設定
- `hetzner_delete_storage_box_subaccount` — 刪除子帳號（**destructive**）
- `hetzner_list_storage_box_snapshots` — 列出 Storage Box 的所有 snapshots（支援分頁）
- `hetzner_create_storage_box_snapshot` — 觸發即時 snapshot（手動備份點）
- `hetzner_delete_storage_box_snapshot` — 刪除指定 snapshot（**destructive**）
- `hetzner_rollback_storage_box_snapshot` — 回滾至指定 snapshot（**destructive**）
- `hetzner_change_storage_box_protection` — 設定刪除保護
- `hetzner_change_storage_box_type` — 升降級 Storage Box 規格（**destructive**）
- `hetzner_reset_storage_box_password` — 重設 Storage Box 密碼
- `hetzner_update_storage_box_access_settings` — 更新 SSH / Samba / WebDAV / ZFS / 外部連線設定
- `hetzner_enable_storage_box_snapshot_plan` — 啟用自動 snapshot 計畫
- `hetzner_disable_storage_box_snapshot_plan` — 停用自動 snapshot 計畫
- `hetzner_get_storage_box_stats` — 取得包含 snapshots 的容量統計
- `hetzner_assert_storage_box_space` — 在備份前檢查可用容量

### Cloud Volumes（4 tools）
- `hetzner_list_volumes` — 列出所有 Cloud Volumes（含掛載路徑、attached server）
- `hetzner_get_volume` — 取得單一 Volume 詳情（確認 linux_device 路徑）
- `hetzner_attach_volume` — 將 Volume attach 到指定 server
- `hetzner_detach_volume` — 將 Volume 從 server detach

### Server Metrics（1 tool）
- `hetzner_get_server_metrics` — 取得 CPU / Disk I/O / Network 即時使用率（預設近 5 分鐘）

### Server RAM via SSH（1 tool）
- `hetzner_get_server_ram` — 透過 SSH 執行 `free -m` 取得 RAM / Swap 使用率（Hetzner Metrics API 不提供記憶體指標）

## 環境變數

| 變數 | 必需 | 說明 |
|------|------|------|
| `HETZNER_API_TOKEN` | ✓ | Cloud 與 Storage Box API 共用的唯一 API token；Cloud 權限限於建立 token 的專案 |

**注意**：MCP Server 是非互動式子進程，環境變數必須寫入 `~/.zshenv`（非 `~/.zshrc`）。

## 新增工具流程

1. `src/types.ts` — 新增 TypeScript 介面
2. `src/api.ts` — 新增 API client 方法
3. `src/tools/<category>.ts` — 新增 MCP tool 定義（`server.registerTool()`，支援 annotations）
4. `src/index.ts` — 若新建 tools 檔案需 import

工具命名規則：`hetzner_` 前綴 + `snake_case`（例：`hetzner_resize_server`）

## Woodpecker CI

| Workflow | 觸發條件 | 用途 |
|----------|---------|------|
| `.woodpecker/ci.yml` | push / pull request | 安裝 git 後執行 package check |
| `.woodpecker/release.yml` verify | tag | 驗證 `CI_COMMIT_TAG=v<package.version>` 並執行完整 check |
| `.woodpecker/release.yml` publish | tag | 使用 `npm_token` secret 執行 `bun publish --access public` |

## 版本發布

PR merge 與 Release Please 版本更新後，tag release 由 `.woodpecker/release.yml` 負責版本 tag verify 與 public publish。

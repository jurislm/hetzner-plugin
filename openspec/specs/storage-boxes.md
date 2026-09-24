# Storage Boxes Tools Spec

## Purpose

提供 Hetzner Storage Box 的查詢、容量檢查與管理工具。Storage Box 使用 Unified API `https://api.hetzner.com/v1`，與 Cloud API 共用 `HETZNER_API_TOKEN`。

## Authentication and transport

- `HETZNER_API_TOKEN` is the only credential variable used by Cloud and Storage Box operations.
- Requests use the shared native-fetch client and return the standard `ToolEnvelope` with redacted errors.
- stdout is reserved for MCP protocol frames; logs use stderr.

## Implementation

- `src/tools/storage-boxes.ts` registers retained Storage Box tools.
- `src/api.ts` adapts retained tools to the native-fetch client.
- `src/client.ts` owns URL construction, authentication, timeout, decoding, and envelope creation.
- `src/errors.ts` formats and redacts generated and retained tool errors.
- `src/generated/operations.ts` contains the generated Unified operation catalog.

## Data and helpers

- `computeStorageBoxStats(box)` uses Hetzner `stats.size` (data plus snapshots) for consumed capacity and `storage_box_type.size` for quota.
- `formatBytes(bytes)` uses binary `GiB`/`MiB` labels.
- `formatStorageBox(box)` and `formatSubaccount(subaccount)` produce escaped Markdown.

## Pagination

- Default list behavior follows `meta.pagination.next_page` up to `PAGINATION_HARD_CAP_PAGES = 5`.
- Explicit `page` or `per_page` requests fetch one page.
- A cap hit is surfaced as `truncated: true` in JSON or a warning in Markdown.

## Retained tools

The retained surface includes `hetzner_list_storage_boxes`, `hetzner_get_storage_box`, `hetzner_list_storage_box_subaccounts`, Storage Box snapshot/action tools, `hetzner_get_storage_box_stats`, and `hetzner_assert_storage_box_space`. The generated Unified catalog additionally covers all operations in the committed Unified OpenAPI snapshot.

## Required behavior

- A configured token produces Cloud and Storage Box requests with the same bearer credential.
- A missing token fails before network access.
- A missing or invalid resource returns a redacted error envelope.
- Stats reports available space, including negative availability when snapshots put a box over quota.
- Assert-space returns `ok: true` when available space meets `required_gib`; otherwise it returns `isError: true` and the measured values.

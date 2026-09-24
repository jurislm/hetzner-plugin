## ADDED Requirements

### Requirement: Unified API token resolution
The Cloud and Storage Box API clients SHALL resolve their bearer token from the single `HETZNER_API_TOKEN` environment variable.
Cloud API access SHALL remain limited to the project where that token was created.

#### Scenario: One token for both APIs
- **WHEN** `HETZNER_API_TOKEN=api-token` is set
- **THEN** Cloud and Storage Box requests use `Authorization: Bearer api-token`

#### Scenario: No token
- **WHEN** `HETZNER_API_TOKEN` is unset
- **THEN** an API operation fails before a provider request with an error naming `HETZNER_API_TOKEN`

### Requirement: Paginated list of Storage Boxes
The `hetzner_list_storage_boxes` tool SHALL fetch all pages of Storage Boxes from the unified API by default, traversing `meta.pagination.next_page` until exhausted or a hard cap of 5 pages is reached. Callers MAY override the loop by supplying explicit `page` and/or `per_page` parameters, in which case exactly one page SHALL be fetched.

#### Scenario: Single page response
- **WHEN** the API returns `{ storage_boxes: [box1, box2], meta: { pagination: { next_page: null } } }` on the first request
- **THEN** the tool returns both boxes and makes exactly one HTTP request

#### Scenario: Multi-page traversal
- **WHEN** the API returns `next_page: 2` then `next_page: 3` then `next_page: null`
- **THEN** the tool makes 3 HTTP requests and returns the concatenated boxes from all 3 pages, in order

#### Scenario: Pagination cap reached
- **WHEN** the API returns a non-null `next_page` for 5 consecutive pages
- **THEN** the tool returns the 5 pages of boxes accumulated so far AND emits a warning line (markdown output) or `truncated: true` field (JSON output) indicating the cap was reached

#### Scenario: Manual page override
- **WHEN** the caller supplies `page: 2, per_page: 10`
- **THEN** the tool issues exactly one request with `?page=2&per_page=10` and returns only that page's boxes

### Requirement: Paginated list of Storage Box subaccounts
The `hetzner_list_storage_box_subaccounts` tool SHALL apply the same pagination behavior as `hetzner_list_storage_boxes` against the `/storage_boxes/{id}/subaccounts` endpoint.

#### Scenario: Multi-page subaccounts
- **WHEN** a Storage Box has 60 subaccounts and `per_page` defaults to 50
- **THEN** the tool returns all 60 subaccounts after 2 HTTP requests

### Requirement: Binary-prefix byte formatting
The `formatBytes` helper SHALL use binary divisors (`1024**3`, `1024**2`) AND label its output with binary prefixes (`GiB`, `MiB`).

#### Scenario: Gigabyte-scale value
- **WHEN** `formatBytes(1099511627776)` is called (= 1024 GiB)
- **THEN** the result is `"1024.0 GiB"`

#### Scenario: Sub-gigabyte value
- **WHEN** `formatBytes(524288000)` is called (= 500 MiB)
- **THEN** the result is `"500 MiB"`

#### Scenario: Zero
- **WHEN** `formatBytes(0)` is called
- **THEN** the result is `"0 MiB"`

### Requirement: Deterministic date formatting
The `formatStorageBox` helper SHALL format a non-null `paid_until` as `YYYY-MM-DD` using ISO 8601 string slicing, NOT locale-dependent `Date` methods.

#### Scenario: ISO datetime input
- **WHEN** `box.paid_until` is `"2026-12-31T23:59:59+00:00"`
- **THEN** the rendered line contains `"Paid until: 2026-12-31"` regardless of system locale

#### Scenario: Null paid_until
- **WHEN** `box.paid_until` is `null`
- **THEN** no `"Paid until"` line appears in the output

### Requirement: Type-safe protocol filtering
Protocol-key arrays in `formatStorageBox` and `formatSubaccount` SHALL be typed as `(keyof T)[]` using `as const` tuples so that a typo in a protocol key fails TypeScript compilation.

#### Scenario: Compile-time type safety
- **WHEN** a developer adds `"sftp"` to the `formatSubaccount` protocol list and `HetznerStorageBoxSubaccount` has no `sftp` field
- **THEN** `tsc` reports a type error

### Requirement: Nullable subaccount comment
`HetznerStorageBoxSubaccount.comment` SHALL be typed `string | null` and `formatSubaccount` SHALL omit the comment line when the value is null or empty.

#### Scenario: Null comment
- **WHEN** `sub.comment` is `null`
- **THEN** the output contains no line starting with `"- **Comment**:"`

#### Scenario: Empty-string comment
- **WHEN** `sub.comment` is `""`
- **THEN** the output contains no line starting with `"- **Comment**:"`

#### Scenario: Non-empty comment
- **WHEN** `sub.comment` is `"backup user"`
- **THEN** the output contains a line `"- **Comment**: backup user"`

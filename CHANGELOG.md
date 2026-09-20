# Changelog

This plugin starts from the `@jurislm/hetzner-mcp@1.5.0` capability baseline.

## [1.6.7](https://github.com/jurislm/hetzner-plugin/compare/v1.6.6...v1.6.7) (2026-09-20)


### Bug Fixes

* include Plugin in Hetzner display names ([#9](https://github.com/jurislm/hetzner-plugin/issues/9)) ([e6ef17b](https://github.com/jurislm/hetzner-plugin/commit/e6ef17bd8696c41cd4c741d43120c59cd0536ef6))

## [1.6.6](https://github.com/jurislm/hetzner-plugin/compare/v1.6.5...v1.6.6) (2026-09-18)


### Bug Fixes

* add portable Hetzner starter prompt ([1eb866e](https://github.com/jurislm/hetzner-plugin/commit/1eb866e234e8e1747d7ec1d73b471de242ebeda1))

## [1.6.5](https://github.com/jurislm/hetzner-plugin/compare/v1.6.4...v1.6.5) (2026-09-18)


### Bug Fixes

* align Hetzner plugin with Woodpecker architecture ([1c15984](https://github.com/jurislm/hetzner-plugin/commit/1c15984c7029068fcc1de5119907e46ee486df99))

## [1.6.4](https://github.com/jurislm/hetzner-plugin/compare/v1.6.3...v1.6.4) (2026-09-18)


### Bug Fixes

* add repository marketplace manifest ([e87893a](https://github.com/jurislm/hetzner-plugin/commit/e87893a798cc9f40eb41a641d6fc332361acdee3))

## [1.6.3](https://github.com/jurislm/hetzner-plugin/compare/v1.6.2...v1.6.3) (2026-09-17)


### Bug Fixes

* add plugin icons ([aa4415d](https://github.com/jurislm/hetzner-plugin/commit/aa4415d38ccabeb5683fa76f6696a1cf667dbd77))

## [1.6.2](https://github.com/jurislm/hetzner-plugin/compare/v1.6.1...v1.6.2) (2026-09-16)


### Bug Fixes

* allow slower CI status propagation ([8b3bbff](https://github.com/jurislm/hetzner-plugin/commit/8b3bbff543026ab655d720a9c8ebcec70a685945))

## [1.6.1](https://github.com/jurislm/hetzner-plugin/compare/v1.6.0...v1.6.1) (2026-09-16)


### Bug Fixes

* gate release merges on CI status ([f418753](https://github.com/jurislm/hetzner-plugin/commit/f4187538d6268f0e539f9bea52f35dd1d22b2f6a))
* wait for CI statuses before release merge ([8be582e](https://github.com/jurislm/hetzner-plugin/commit/8be582e6c4628e25bb2ad013304d277baea6b2f1))

## [1.6.0](https://github.com/jurislm/hetzner-plugin/compare/v1.5.0...v1.6.0) (2026-09-16)


### Features

* add release automation ([e3d0978](https://github.com/jurislm/hetzner-plugin/commit/e3d0978e0503608a68a4a5f295641c028ea5b395))
* align Hetzner plugin release contract ([06332c0](https://github.com/jurislm/hetzner-plugin/commit/06332c00d1a423012842a24f3f18cb9e3b936e6c))
* package Hetzner local stdio plugin ([b561901](https://github.com/jurislm/hetzner-plugin/commit/b561901ce9e46e81fcd93bd2629455863b4f772f))


### Bug Fixes

* align Hetzner release metadata ([40f64c9](https://github.com/jurislm/hetzner-plugin/commit/40f64c9e2514a4358f965ae04e58d3da40beb954))
* align plugin version with source baseline ([2e5f031](https://github.com/jurislm/hetzner-plugin/commit/2e5f03146e38add4c32e3977c7dfa3b3aa0b5b17))
* build before CI tests ([e2b6d7d](https://github.com/jurislm/hetzner-plugin/commit/e2b6d7dd349d1389fc9bdca3fee8d4ba6a44414a))
* harden Hetzner generated and package checks ([61518ad](https://github.com/jurislm/hetzner-plugin/commit/61518ad8363a14c48fea780bd692a9c5678817ac))
* harden Hetzner plugin review findings ([36e3bac](https://github.com/jurislm/hetzner-plugin/commit/36e3bac207ecd9ab581bafef525d47f6d3910d1a))
* inject retained Hetzner API requests ([e6da375](https://github.com/jurislm/hetzner-plugin/commit/e6da3755ba45348dfa055df9d2c328abd1c21a68))
* remove obsolete Hetzner test artifacts ([8d46422](https://github.com/jurislm/hetzner-plugin/commit/8d46422153239a4dd2d32339aec948bd3c080636))
* verify package before publish ([61a8050](https://github.com/jurislm/hetzner-plugin/commit/61a80503ab650e8dd6c138159c2782ad7ca0d483))


### Documentation

* align active Bun test specification ([037823f](https://github.com/jurislm/hetzner-plugin/commit/037823fea979ec5870698c12e1f3e14671d66d5c))
* record final Hetzner readback ([bc71f37](https://github.com/jurislm/hetzner-plugin/commit/bc71f3721b4b04ee386c498104af5756b7c55c17))
* record Hetzner Woodpecker setup ([1dd1e76](https://github.com/jurislm/hetzner-plugin/commit/1dd1e7621b55dd50efda2b0046d33291b89d2662))
* refresh Hetzner version readback ([9b8a0eb](https://github.com/jurislm/hetzner-plugin/commit/9b8a0eb58e16c3a48a81f96851ebe55ee40fc2d3))
* update Hetzner release readback ([012d997](https://github.com/jurislm/hetzner-plugin/commit/012d9977fa8ca0ba50fb80ee0d9c475bb2799673))

## [1.5.0](https://github.com/jurislm/hetzner-mcp/compare/v1.4.4...v1.5.0) (2026-07-08)


### Features

* **storage-boxes:** 新增 hetzner_get_storage_box_stats 與 hetzner_assert_storage_box_space 工具 ([#54](https://github.com/jurislm/hetzner-mcp/issues/54)) ([3973582](https://github.com/jurislm/hetzner-mcp/commit/3973582548f04650c817a2700a33095b5d2a8e57))

## [1.4.4](https://github.com/jurislm/hetzner-mcp/compare/v1.4.3...v1.4.4) (2026-07-08)


### Bug Fixes

* **servers:** 改用 location 取代已被 Hetzner 移除的 datacenter 欄位 ([#53](https://github.com/jurislm/hetzner-mcp/issues/53)) ([b8d97ce](https://github.com/jurislm/hetzner-mcp/commit/b8d97ced15035f9ef94b9e2e259f3bc408480565))


### Documentation

* pull latest main before publishing a release ([#50](https://github.com/jurislm/hetzner-mcp/issues/50)) ([8951068](https://github.com/jurislm/hetzner-mcp/commit/89510682924f98ecfe3a3e48bfa4ec577182ce38))

## [1.4.3](https://github.com/jurislm/hetzner-mcp/compare/v1.4.2...v1.4.3) (2026-07-06)


### Bug Fixes

* **security:** patch vulnerable dependencies and escape image output ([#48](https://github.com/jurislm/hetzner-mcp/issues/48)) ([af7dd06](https://github.com/jurislm/hetzner-mcp/commit/af7dd061d3a92131a3c9d355d81f878b9f276179))

## [1.4.2](https://github.com/jurislm/hetzner-mcp/compare/v1.4.1...v1.4.2) (2026-06-24)


### Bug Fixes

* clean up temp known_hosts dir on runSsh setup-error path ([915f3f2](https://github.com/jurislm/hetzner-mcp/commit/915f3f22c2ba24b4ba9918a9e109e5450ee597e2))
* **security:** pin only the fingerprint-verified host key, not every scanned key ([9be2230](https://github.com/jurislm/hetzner-mcp/commit/9be22309494d85f083df75dcdcebf1fc1757621b))
* **security:** reject dot-only path segments and pin verified SSH host keys ([38a8992](https://github.com/jurislm/hetzner-mcp/commit/38a8992514fca49d9fb4fbebcb672e30c2fe9021))
* **security:** reject dot-only path segments and pin verified SSH host keys ([38a8992](https://github.com/jurislm/hetzner-mcp/commit/38a8992514fca49d9fb4fbebcb672e30c2fe9021))
* **security:** reject dot-only path segments and pin verified SSH host keys ([ee7fb90](https://github.com/jurislm/hetzner-mcp/commit/ee7fb908ff46b9d045f87958f147b7c2c2aa4c6d))

## [1.4.1](https://github.com/jurislm/hetzner-mcp/compare/v1.4.0...v1.4.1) (2026-05-26)


### Bug Fixes

* **security:** comprehensive security hardening — input validation, escapeHtml, TOFU prevention, credential-safe logging ([#42](https://github.com/jurislm/hetzner-mcp/issues/42)) ([2e0e719](https://github.com/jurislm/hetzner-mcp/commit/2e0e7191cb816cca40871af8f14fd589f42b996d))

## [1.4.0](https://github.com/jurislm/hetzner-mcp/compare/v1.3.4...v1.4.0) (2026-05-26)


### Features

* add GitHub Pages landing page (docs/index.html) ([36688a9](https://github.com/jurislm/hetzner-mcp/commit/36688a983e25a38665dc395e72ee3986275050a2))
* add i18n — 繁體中文, 日本語, 한국어 ([9fda04d](https://github.com/jurislm/hetzner-mcp/commit/9fda04d950b42a4ee2fdf5525be426f3ac1532ba))


### Documentation

* explain ⚠ legend in README and landing page ([6a343a0](https://github.com/jurislm/hetzner-mcp/commit/6a343a0d35d5c04c687b57ac6104f8f77ab7033d))

## [1.3.4](https://github.com/jurislm/hetzner-mcp/compare/v1.3.3...v1.3.4) (2026-05-26)


### Documentation

* rewrite README — focused, accurate, developer-first ([9bd1898](https://github.com/jurislm/hetzner-mcp/commit/9bd18987fc95fba5caa2ac8ef75e5e2cd436e7c0))

## [1.3.3](https://github.com/jurislm/hetzner-mcp/compare/v1.3.2...v1.3.3) (2026-05-26)


### Bug Fixes

* **security:** post-review hardening — HTML escaping, IPv4 octet range, image regex + README rewrite ([#34](https://github.com/jurislm/hetzner-mcp/issues/34)) ([50fea57](https://github.com/jurislm/hetzner-mcp/commit/50fea57f3234070021399e0973c8c231471816bc))

## [1.3.2](https://github.com/jurislm/hetzner-mcp/compare/v1.3.1...v1.3.2) (2026-05-26)


### Bug Fixes

* **security:** resolve H-1/H-2/M-1/M-2/M-3 — path injection, CVE deps, password policy, SSH trust ([#32](https://github.com/jurislm/hetzner-mcp/issues/32)) ([87b6327](https://github.com/jurislm/hetzner-mcp/commit/87b6327c2b62df623c66819160a2bd82f82c5df0))

## [1.3.1](https://github.com/jurislm/hetzner-mcp/compare/v1.3.0...v1.3.1) (2026-05-15)


### Refactoring

* remove 24 unused type aliases from types.ts ([f35025c](https://github.com/jurislm/hetzner-mcp/commit/f35025c90b81933ab028cd59dd22197067277660))
* remove 24 unused type aliases from types.ts ([fd7f89f](https://github.com/jurislm/hetzner-mcp/commit/fd7f89f93b5e3c04e3beea2eaa304b73307db0cf))

## [1.3.0](https://github.com/jurislm/hetzner-mcp/compare/v1.2.1...v1.3.0) (2026-05-15)


### Features

* add Cloud Volume tools (list, get, attach, detach) ([#25](https://github.com/jurislm/hetzner-mcp/issues/25)) ([6262c35](https://github.com/jurislm/hetzner-mcp/commit/6262c3599a6ae03173861d1481d4ea9320bc77ec))
* add Cloud Volume tools and Server Metrics tool ([4b8088f](https://github.com/jurislm/hetzner-mcp/commit/4b8088fdad8c6999f26945b9fcf87edd063810f4))
* add Cloud Volume tools and Server Metrics tool ([#28](https://github.com/jurislm/hetzner-mcp/issues/28)) ([4b8088f](https://github.com/jurislm/hetzner-mcp/commit/4b8088fdad8c6999f26945b9fcf87edd063810f4))
* add hetzner_get_server_metrics tool ([#26](https://github.com/jurislm/hetzner-mcp/issues/26)) ([440c435](https://github.com/jurislm/hetzner-mcp/commit/440c435434305b1242e1300090c8dece7d16cdf7))
* add hetzner_get_server_ram tool via SSH ([#27](https://github.com/jurislm/hetzner-mcp/issues/27)) ([6dfcd25](https://github.com/jurislm/hetzner-mcp/commit/6dfcd25a9a7ca0cf750c2f5a6c036e9238a3c67f))


### Bug Fixes

* address CodeRabbit/Copilot review feedback on metrics and server-ssh ([e75fd56](https://github.com/jurislm/hetzner-mcp/commit/e75fd5621cd3174f941f875ab8b1d5c7fbdab124))
* address PR [#28](https://github.com/jurislm/hetzner-mcp/issues/28) review feedback ([8b5e261](https://github.com/jurislm/hetzner-mcp/commit/8b5e261aefa0e211a41ca681775ec2f7af6513a5))
* guard ssh_user against option injection (HIGH security) ([8986af0](https://github.com/jurislm/hetzner-mcp/commit/8986af0f36c5b74c1afe5b8dd4324129e4379912))
* import shared ResponseFormatSchema in volumes.ts ([8e1f6c8](https://github.com/jurislm/hetzner-mcp/commit/8e1f6c8bd8f2c23855f3f224248635d330ad56c4))

## [1.2.1](https://github.com/jurislm/hetzner-mcp/compare/v1.2.0...v1.2.1) (2026-05-08)


### Bug Fixes

* add percentage usage to storage box markdown output ([55135ad](https://github.com/jurislm/hetzner-mcp/commit/55135adc55b34c6bbd8fb9854ce612361aa271d1))
* add percentage usage to storage box markdown output ([#22](https://github.com/jurislm/hetzner-mcp/issues/22)) ([2935774](https://github.com/jurislm/hetzner-mcp/commit/2935774ec63147a0096bce8d63bb13b09af05174))
* guard usagePercent against division by zero ([c5bcff3](https://github.com/jurislm/hetzner-mcp/commit/c5bcff36cdfff40542a603828acc68d6b38c3042))

## [1.2.0](https://github.com/jurislm/hetzner-mcp/compare/v1.1.1...v1.2.0) (2026-05-05)


### Features

* add pagination for servers/ssh-keys and filters for storage boxes ([b6854d8](https://github.com/jurislm/hetzner-mcp/commit/b6854d8e7a95df3a4c72c3a64316e0961e0a784b))
* add pagination for servers/ssh-keys and filters for storage boxes ([31bc9de](https://github.com/jurislm/hetzner-mcp/commit/31bc9de650468a37d7223e73629cfb29dbfa4588))
* implement 14 missing Storage Box API endpoints ([76eee1b](https://github.com/jurislm/hetzner-mcp/commit/76eee1b12d4b39813b26e80a565b66086c57ca8e))
* implement 14 missing Storage Box API endpoints ([#12](https://github.com/jurislm/hetzner-mcp/issues/12)) ([6a56f9a](https://github.com/jurislm/hetzner-mcp/commit/6a56f9a0504ce8d60edf77d52d001af73af4761e))


### Bug Fixes

* make storage_box_type.size required per official API spec ([3dd51e4](https://github.com/jurislm/hetzner-mcp/commit/3dd51e48dcf99851fdfccab7b729bb82a0c3e3a6))
* use storage_box_type.size for total capacity in formatStorageBox (closes [#16](https://github.com/jurislm/hetzner-mcp/issues/16)) ([7568cac](https://github.com/jurislm/hetzner-mcp/commit/7568cac9b5bccf38e374a0670de3d671dc8e3a1c))


### Documentation

* add Hetzner unified API reference with implementation coverage ([081224c](https://github.com/jurislm/hetzner-mcp/commit/081224c6b88edfe23363f0bbaa6df0b9930a49cf))

## [1.1.1](https://github.com/jurislm/hetzner-mcp/compare/v1.1.0...v1.1.1) (2026-05-05)


### Bug Fixes

* restore [@jurislm](https://github.com/jurislm) scope in package.json name ([#11](https://github.com/jurislm/hetzner-mcp/issues/11)) ([24a1516](https://github.com/jurislm/hetzner-mcp/commit/24a1516b533717f1269ff76942f25923d4ed242f))
* update HetznerStorageBoxSchema to match unified API structure (closes [#13](https://github.com/jurislm/hetzner-mcp/issues/13)) ([#14](https://github.com/jurislm/hetzner-mcp/issues/14)) ([0e91466](https://github.com/jurislm/hetzner-mcp/commit/0e91466241d951864b3a3b77f31125dc972352ed))

## [1.1.0](https://github.com/jurislm/hetzner-mcp/compare/v1.0.0...v1.1.0) (2026-05-04)


### Features

* add Storage Box snapshot management tools (closes [#8](https://github.com/jurislm/hetzner-mcp/issues/8)) ([#9](https://github.com/jurislm/hetzner-mcp/issues/9)) ([3a28085](https://github.com/jurislm/hetzner-mcp/commit/3a28085179b97b79c3b565e12a1f13aced6a698e))


### Bug Fixes

* address /review-pr round 3 — Critical + Important findings ([e1520d2](https://github.com/jurislm/hetzner-mcp/commit/e1520d2c9923d362db1b9af39a32f68e612befd6))
* restore storage-boxes in docs and add storage-boxes spec ([824ba2a](https://github.com/jurislm/hetzner-mcp/commit/824ba2a2e0876c2d9bd5a433d4f62d3d402c336d))
* restore storage-boxes in docs and add storage-boxes spec ([4484d86](https://github.com/jurislm/hetzner-mcp/commit/4484d86a3282460ce85df9e6018f57b8952a3ed2))
* **storage-boxes:** address /review-pr round 2 findings ([3c360af](https://github.com/jurislm/hetzner-mcp/commit/3c360af75a9f49224cbbab5dae237c9865dabec1))
* **storage-boxes:** address PR [#2](https://github.com/jurislm/hetzner-mcp/issues/2) review findings + add vitest baseline ([6a6daae](https://github.com/jurislm/hetzner-mcp/commit/6a6daae261ad8b44ac23b34d82f3cc1a840bdd45))
* **storage-boxes:** C-1 Zod runtime validation at API boundary ([38dec82](https://github.com/jurislm/hetzner-mcp/commit/38dec82c0091f008d7b7e8e3215f568c174aaa85))


### Documentation

* add CLAUDE.md reflecting 17 tools, vitest, GitHub Actions ([f9ba129](https://github.com/jurislm/hetzner-mcp/commit/f9ba1292987dea35e4c24f137ad181cc1a980b83))
* add openspec specs and fix CLAUDE.md ghost entities ([a9f75d0](https://github.com/jurislm/hetzner-mcp/commit/a9f75d05dd045e4d9ddd2548b066e1a10924ed25))
* add openspec specs and fix CLAUDE.md ghost entities ([3fc00de](https://github.com/jurislm/hetzner-mcp/commit/3fc00de8a6c2d51121de8efbe6af93306f804322))
* rewrite README to match jurislm MCP standard format ([9a70686](https://github.com/jurislm/hetzner-mcp/commit/9a70686392cc8cd96585ad0b354c0d179a4b7861))
* update copilot-instructions with hetzner-mcp specific context ([630fdf3](https://github.com/jurislm/hetzner-mcp/commit/630fdf3428f62f971cb5e3aa17719d04ab682bc9))
* use bunx instead of npx in MCP configuration example ([3b7f457](https://github.com/jurislm/hetzner-mcp/commit/3b7f457fe46b84fcaa87f9797b418de5bd4893e5))

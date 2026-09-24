# Hetzner Plugin — Overview Spec

## Purpose

`@jurislm/hetzner-plugin` is a public Bun local-stdio MCP plugin. It exposes generated Cloud and Unified operations together with retained focused tools for Hetzner infrastructure and Storage Boxes.

## Architecture

```
src/
├── index.ts                 # MCP server entry and local stdio startup
├── client.ts                # native-fetch generated-operation client
├── api.ts                   # retained-tool adapter over the shared client
├── errors.ts                # shared error formatting and redaction
├── server.ts                # generated and retained MCP registration
├── generated/               # OpenAPI-generated types and operation registry
└── tools/                   # retained focused tools
api/manifest.json            # single canonical API provenance manifest
openapi/                     # committed Cloud and Unified snapshots only
```

## Operation inventory

The generated registry contains 190 Cloud operations and 32 Unified operations. Retained tools remain available for servers, SSH keys, references, Storage Boxes, volumes, metrics, and RAM-over-SSH.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `HETZNER_API_TOKEN` | Required | Shared token for Cloud and Storage Box API requests; Cloud access is limited to the token's project. |

## Naming and output

- Generated names use `hetzner_cloud_` or `hetzner_unified_` plus the operation name.
- Retained names use the `hetzner_` prefix and snake case.
- Generated and retained handlers return the shared `ToolEnvelope` shape and use shared error redaction.

## Transport and CI

The plugin is local stdio only. stdout is reserved for MCP frames; logs go to stderr. CI and tag release flow are Woodpecker-only through `.woodpecker/ci.yml` and `.woodpecker/release.yml`; remote MCP, OAuth, and hosting flows are out of scope.

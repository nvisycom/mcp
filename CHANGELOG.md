# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.45.0] - 2026-09-07

### Added

- `upload_file` puts a local file into a workspace, and `redact` uploads,
  detects and writes the redacted copy in a single call. Both read only from
  the client's workspace directory, or from `NVISY_FILES_DIR` when set, which
  takes precedence so a client cannot widen what the operator allowed; a path
  resolving outside, symlinks included, is refused
- `describe_pipeline` reports what a pipeline actually detects, resolving its
  policies and their entity labels

### Changed

- **Breaking:** `redact_file` is now `detect`. It finds entities and does not
  redact, which the old name implied and the new `redact` tool now does

### Removed

- **Breaking:** `list_policies` and `list_labels`. A policy summary carries no
  definition, so the listing said nothing about what a policy redacts, and the
  label catalogue was deployment-wide rather than tied to a pipeline.
  `describe_pipeline` answers both questions against a specific pipeline

### Notes

- Requires `@nvisy/sdk` 0.45. Its breaking changes are confined to syncs,
  connections and LLM configuration, none of which this server exposes

[0.45.0]: https://github.com/nvisycom/mcp/compare/v0.44.0...v0.45.0

## [0.44.0] - 2026-09-07

### Added

- Initial release: an MCP server exposing the Nvisy platform to agent runtimes,
  over stdio (`npx @nvisy/mcp`) or embedded as a library via `createServer`
- Discovery tools: `list_workspaces`, `list_pipelines`, `list_policies`,
  `list_files`, `list_labels`, `list_detections`
- Redaction tools: `redact_file` runs a pipeline over a file and waits for the
  findings, `get_detection` polls a run, `get_analysis` summarises what was
  found, and `apply_redaction` writes a redacted copy
- `redact_file` reports progress while polling and stops as soon as the client
  cancels; a run that outlives the poll window is handed back as a detection id
- The workspace comes from the tool call, falling back to `NVISY_WORKSPACE`

### Notes

- No tool uploads or deletes anything, and account administration is not
  exposed
- Requires Node.js 24, matching the SDK

[0.44.0]: https://github.com/nvisycom/mcp/releases/tag/v0.44.0

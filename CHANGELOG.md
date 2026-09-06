# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

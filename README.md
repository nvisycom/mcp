# @nvisy/mcp

[![npm](https://img.shields.io/npm/v/@nvisy/mcp?style=flat-square)](https://www.npmjs.com/package/@nvisy/mcp)
[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/mcp/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/mcp/actions/workflows/build.yml)

[Model Context Protocol](https://modelcontextprotocol.io) server for the
[Nvisy](https://nvisy.com/) multimodal redaction platform.

Nvisy detects and removes sensitive information across documents, images, and audio.
It combines deterministic patterns, NER, computer vision, and LLM-driven classification
into auditable, policy-driven pipelines built for regulated industries such as
healthcare, legal, government, and financial services.

This server exposes the platform to MCP-compatible clients such as Claude Code,
Claude Desktop, and other agent runtimes. It is built on top of
[@nvisy/sdk](https://github.com/nvisycom/sdk-ts).

## Installation

```bash
npm install @nvisy/mcp
```

## Quick Start

Run the server directly with `npx`:

```bash
NVISY_API_TOKEN=your-api-token npx @nvisy/mcp
```

### Claude Desktop

Add the server to your configuration file:

```json
{
  "mcpServers": {
    "nvisy": {
      "command": "npx",
      "args": ["-y", "@nvisy/mcp"],
      "env": {
        "NVISY_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add nvisy --env NVISY_API_TOKEN=your-api-token -- npx -y @nvisy/mcp
```

## Tools

| Tool | Description |
| --- | --- |
| `list_workspaces` | Workspaces the API token can access |
| `list_pipelines` | Redaction pipelines in a workspace |
| `list_policies` | Policies deciding what is detected and how it is redacted |
| `list_files` | Files stored in a workspace |
| `list_labels` | Entity labels this deployment can detect |
| `list_detections` | Detection runs, most recent first |
| `redact_file` | Run a pipeline over a file and wait for the findings |
| `get_detection` | Poll a detection's status |
| `get_analysis` | Summarise what a detection found |
| `apply_redaction` | Write a redacted copy of the file |

A typical run is `list_files` to find a file, `list_pipelines` to choose a
pipeline, `redact_file` to detect, `get_analysis` to review, then
`apply_redaction` to produce the redacted output.

Files are uploaded through the Nvisy app or API rather than this server, and no
tool deletes anything.

## Configuration

The server is configured through the environment:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NVISY_API_TOKEN` | Yes | — | API token used to authenticate against the Nvisy API |
| `NVISY_BASE_URL` | No | `https://api.nvisy.com` | Base URL of the Nvisy API |
| `NVISY_WORKSPACE` | No | — | Default workspace slug; every tool can override it |

## Features

- Modern ES2022+ JavaScript target
- Full TypeScript support with strict typing
- Runs standalone over stdio, or embedded as a library
- Built on the official Nvisy TypeScript SDK

## Deployment

The fastest way to get started is with [Nvisy Cloud](https://nvisy.com).

To run locally, see the [nvisycom/server](https://github.com/nvisycom/server) (self-hosted backend) and [nvisycom/studio](https://github.com/nvisycom/studio) (web and desktop app) repositories.

If you only need redaction and not the full platform, [nvisycom/elide](https://github.com/nvisycom/elide) is a standalone framework for building PII detection and removal pipelines over multimodal documents.

## Node.js

Requires Node.js 24.0.0 or higher.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes and version history.

## License

MIT License, see [LICENSE.txt](LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [github.com/nvisycom/mcp/issues](https://github.com/nvisycom/mcp/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)

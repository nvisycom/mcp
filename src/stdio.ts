#!/usr/bin/env node
/**
 * @fileoverview Executable entry point for the Nvisy MCP server over stdio.
 *
 * This is the binary MCP clients spawn (`npx @nvisy/mcp`). It reads
 * configuration from the environment and serves over stdin/stdout.
 *
 * @module stdio
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { configFromEnvironment, SERVER_NAME, VERSION } from "@/config.js";
import { createServer } from "@/server.js";

async function main(): Promise<void> {
	const server = createServer(configFromEnvironment());
	await server.connect(new StdioServerTransport());

	// stdout carries the protocol, so anything human-readable goes to stderr.
	process.stderr.write(`${SERVER_NAME} mcp server ${VERSION} ready\n`);
}

main().catch((error: unknown) => {
	process.stderr.write(
		`${error instanceof Error ? error.message : String(error)}\n`,
	);
	process.exit(1);
});

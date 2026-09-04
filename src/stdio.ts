#!/usr/bin/env node
/**
 * @fileoverview Executable entry point for the Nvisy MCP server over stdio.
 *
 * This is the binary MCP clients spawn (`npx @nvisy/mcp`). It reads
 * configuration from the environment and serves over stdin/stdout.
 *
 * @module stdio
 */

import { SERVER_NAME, VERSION } from "@/config.js";

async function main(): Promise<void> {
	// Tools and transport wiring land here.
	process.stderr.write(`${SERVER_NAME} mcp server ${VERSION}\n`);
}

main().catch((error: unknown) => {
	process.stderr.write(`${String(error)}\n`);
	process.exit(1);
});

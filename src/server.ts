/**
 * @fileoverview Server assembly.
 *
 * @module server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SERVER_NAME, type ServerConfig, VERSION } from "@/config.js";
import { Context } from "@/context.js";
import { registerTools } from "@/tools/index.js";

/**
 * Builds a Nvisy MCP server with every tool registered.
 *
 * The returned server is not connected to a transport; the caller decides how
 * it is served.
 *
 * @param config - Resolved server configuration
 * @returns The configured server
 *
 * @example
 * ```typescript
 * const server = createServer({ apiToken: "..." });
 * await server.connect(new StdioServerTransport());
 * ```
 */
export function createServer(config: ServerConfig): McpServer {
	const server = new McpServer({ name: SERVER_NAME, version: VERSION });
	registerTools(server, new Context(config));
	return server;
}

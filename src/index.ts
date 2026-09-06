/**
 * @fileoverview Library entry point for the Nvisy MCP server.
 *
 * Exposes the server factory so it can be embedded in a host application.
 * For the standalone executable, see `src/stdio.ts`.
 *
 * @module index
 */

// Configuration
export type { ServerConfig } from "@/config.js";
export {
	configFromEnvironment,
	ENV,
	resolveVersion,
	SERVER_NAME,
	VERSION,
} from "@/config.js";
// Context
export { Context } from "@/context.js";
// Server
export { createServer } from "@/server.js";

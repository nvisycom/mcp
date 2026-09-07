/**
 * @fileoverview Tool registry.
 *
 * @module tools
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Context } from "@/context.js";
import { registerDetections } from "@/tools/detections.js";
import { registerFiles } from "@/tools/files.js";
import { registerPipelines } from "@/tools/pipelines.js";
import { registerRedactions } from "@/tools/redactions.js";
import { registerWorkspaces } from "@/tools/workspaces.js";

/**
 * Registers every tool on the server.
 *
 * @param server - The MCP server to register on
 * @param ctx - Shared tool context
 */
export function registerTools(server: McpServer, ctx: Context): void {
	registerWorkspaces(server, ctx);
	registerPipelines(server, ctx);
	registerFiles(server, ctx);
	registerDetections(server, ctx);
	registerRedactions(server, ctx);
}

/**
 * @fileoverview Workspace discovery tools.
 *
 * @module tools/workspaces
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Context } from "@/context.js";
import { guard, text } from "@/errors.js";
import { fields, list } from "@/format.js";

/**
 * Registers workspace tools.
 *
 * @param server - The MCP server to register on
 * @param ctx - Shared tool context
 */
export function registerWorkspaces(server: McpServer, ctx: Context): void {
	server.registerTool(
		"list_workspaces",
		{
			title: "List workspaces",
			description:
				"List the workspaces the API token can access. Use this first when no " +
				"workspace is configured: every other tool needs a workspace slug.",
			inputSchema: {},
			annotations: { readOnlyHint: true, destructiveHint: false },
		},
		async () =>
			guard(async () => {
				const page = await ctx.client.workspaces.listWorkspaces();
				return text(
					list(page, "workspaces", (workspace) =>
						fields(
							["slug", workspace.slug],
							["name", workspace.displayName],
							["role", workspace.memberRole],
						),
					),
				);
			}),
	);
}

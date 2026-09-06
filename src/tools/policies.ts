/**
 * @fileoverview Policy discovery tools.
 *
 * @module tools/policies
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Context } from "@/context.js";
import { guard, text } from "@/errors.js";
import { fields, list } from "@/format.js";
import { AFTER_ARG, LIMIT_ARG, WORKSPACE_ARG } from "@/tools/common.js";

/**
 * Registers policy tools.
 *
 * @param server - The MCP server to register on
 * @param ctx - Shared tool context
 */
export function registerPolicies(server: McpServer, ctx: Context): void {
	server.registerTool(
		"list_policies",
		{
			title: "List policies",
			description:
				"List the redaction policies in a workspace. A policy decides which " +
				"entity labels are detected and how each is redacted.",
			inputSchema: {
				workspace: WORKSPACE_ARG,
				limit: LIMIT_ARG,
				after: AFTER_ARG,
			},
			annotations: { readOnlyHint: true, destructiveHint: false },
		},
		async ({ workspace, limit, after }) =>
			guard(async () => {
				const page = await ctx.client.policies.listPolicies(
					ctx.workspace(workspace),
					{ limit, after, includeCount: true },
				);
				return text(
					list(page, "policies", (policy) =>
						fields(
							["slug", policy.slug],
							["name", policy.displayName],
							["description", policy.description],
						),
					),
				);
			}),
	);
}

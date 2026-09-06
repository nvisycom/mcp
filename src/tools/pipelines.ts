/**
 * @fileoverview Pipeline discovery tools.
 *
 * @module tools/pipelines
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Context } from "@/context.js";
import { guard, text } from "@/errors.js";
import { fields, list } from "@/format.js";
import { WORKSPACE_ARG } from "@/tools/common.js";

/**
 * Registers pipeline tools.
 *
 * @param server - The MCP server to register on
 * @param ctx - Shared tool context
 */
export function registerPipelines(server: McpServer, ctx: Context): void {
	server.registerTool(
		"list_pipelines",
		{
			title: "List pipelines",
			description:
				"List the redaction pipelines in a workspace. A pipeline defines which " +
				"policies run over a document; redact_file needs one of these slugs.",
			inputSchema: {
				workspace: WORKSPACE_ARG,
				search: z.string().optional().describe("Filter pipelines by name."),
			},
			annotations: { readOnlyHint: true, destructiveHint: false },
		},
		async ({ workspace, search }) =>
			guard(async () => {
				const page = await ctx.client.pipelines.listPipelines(
					ctx.workspace(workspace),
					search ? { search } : undefined,
				);
				return text(
					list(page, "pipelines", (pipeline) =>
						fields(
							["slug", pipeline.slug],
							["name", pipeline.displayName],
							["status", pipeline.status],
						),
					),
				);
			}),
	);
}

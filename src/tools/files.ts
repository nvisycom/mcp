/**
 * @fileoverview File discovery tools.
 *
 * @module tools/files
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Context } from "@/context.js";
import { guard, text } from "@/errors.js";
import { fields, list } from "@/format.js";
import { AFTER_ARG, LIMIT_ARG, WORKSPACE_ARG } from "@/tools/common.js";

/** Renders a byte count in the largest unit that keeps it readable. */
function size(bytes: number): string {
	const units = ["B", "KB", "MB", "GB"];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)}${units[unit]}`;
}

/**
 * Registers file tools.
 *
 * @param server - The MCP server to register on
 * @param ctx - Shared tool context
 */
export function registerFiles(server: McpServer, ctx: Context): void {
	server.registerTool(
		"list_files",
		{
			title: "List files",
			description:
				"List the files stored in a workspace. Use this to find the fileId " +
				"redact_file needs. Files are uploaded through the Nvisy app or API, " +
				"not through this server.",
			inputSchema: {
				workspace: WORKSPACE_ARG,
				limit: LIMIT_ARG,
				after: AFTER_ARG,
			},
			annotations: { readOnlyHint: true, destructiveHint: false },
		},
		async ({ workspace, limit, after }) =>
			guard(async () => {
				const page = await ctx.client.files.listFiles(
					ctx.workspace(workspace),
					{ limit, after, includeCount: true },
				);
				return text(
					list(page, "files", (file) =>
						fields(
							["id", file.id],
							["name", file.displayName],
							["kind", file.fileKind],
							["size", size(file.fileSize)],
						),
					),
				);
			}),
	);
}

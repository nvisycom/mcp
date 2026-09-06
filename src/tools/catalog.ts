/**
 * @fileoverview Catalog tools for the deployment's detectable entity labels.
 *
 * @module tools/catalog
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Context } from "@/context.js";
import { guard, text } from "@/errors.js";

/**
 * Registers catalog tools.
 *
 * @param server - The MCP server to register on
 * @param ctx - Shared tool context
 */
export function registerCatalog(server: McpServer, ctx: Context): void {
	server.registerTool(
		"list_labels",
		{
			title: "List entity labels",
			description:
				"List the entity labels this deployment can detect, such as person " +
				"names or medical record numbers. These are the labels that appear in " +
				"a detection's analysis.",
			inputSchema: {},
			annotations: { readOnlyHint: true, destructiveHint: false },
		},
		async () =>
			guard(async () => {
				const catalog = await ctx.client.catalog.listLabels();
				const entries = Object.entries(catalog);

				if (entries.length === 0) {
					return text("No labels found.");
				}

				const lines = entries.map(([key, label]) => {
					const name =
						typeof label === "object" &&
						label !== null &&
						"displayName" in label
							? String((label as { displayName?: unknown }).displayName ?? key)
							: key;
					return `- ${key}${name !== key ? ` (${name})` : ""}`;
				});

				return text([`${entries.length} labels:`, ...lines].join("\n"));
			}),
	);
}

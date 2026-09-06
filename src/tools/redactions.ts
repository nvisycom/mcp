/**
 * @fileoverview Redaction tools: turning a detection into a redacted file.
 *
 * @module tools/redactions
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Context } from "@/context.js";
import { guard, text } from "@/errors.js";
import { fields } from "@/format.js";
import { WORKSPACE_ARG } from "@/tools/common.js";

/**
 * Registers redaction tools.
 *
 * @param server - The MCP server to register on
 * @param ctx - Shared tool context
 */
export function registerRedactions(server: McpServer, ctx: Context): void {
	server.registerTool(
		"apply_redaction",
		{
			title: "Produce a redacted file",
			description:
				"Apply a completed detection's findings, writing a new redacted file " +
				"into the workspace. Redacts exactly what the pipeline's policies " +
				"decided; the original file is left untouched.",
			inputSchema: {
				detectionId: z
					.string()
					.describe("A completed detection, from redact_file."),
				workspace: WORKSPACE_ARG,
			},
			annotations: { readOnlyHint: false, destructiveHint: false },
		},
		async ({ detectionId, workspace }) =>
			guard(async () => {
				const result = await ctx.client.detections.createRedaction(
					ctx.workspace(workspace),
					detectionId,
					{},
				);

				return text(
					[
						"Redaction complete.",
						fields(
							["redactionId", result.id],
							["outputFileId", result.outputFileId],
						),
						result.outputFileId
							? "Download the redacted file from the Nvisy app or API using this file id."
							: "No output file was produced.",
					].join("\n"),
				);
			}),
	);
}

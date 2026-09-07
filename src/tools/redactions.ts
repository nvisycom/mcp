/**
 * @fileoverview Redaction tools: turning findings into a redacted file, and
 * the whole path from a local file to that output.
 *
 * @module tools/redactions
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Context } from "@/context.js";
import { guard, text } from "@/errors.js";
import { fields } from "@/format.js";
import { WORKSPACE_ARG } from "@/tools/common.js";
import { detectAndWait } from "@/tools/detections.js";
import { describeFile, uploadFrom } from "@/tools/files.js";

/** Renders the outcome of applying a detection's findings. */
function describeResult(id: string, outputFileId: string | undefined): string {
	return [
		fields(["redactionId", id], ["outputFileId", outputFileId]),
		outputFileId
			? "Download the redacted file from the Nvisy app or API using this file id."
			: "No output file was produced.",
	].join("\n");
}

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
				detectionId: z.string().describe("A completed detection, from detect."),
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
					`Redaction complete.\n${describeResult(result.id, result.outputFileId)}`,
				);
			}),
	);

	server.registerTool(
		"redact",
		{
			title: "Redact a local file",
			description:
				"Upload a local file, run a pipeline over it, and write the redacted " +
				"copy: the whole path in one call. Use detect and apply_redaction " +
				"separately when the findings should be reviewed before the redacted " +
				"file is written.",
			inputSchema: {
				path: z
					.string()
					.describe(
						"Path to the file, absolute or relative to the workspace directory.",
					),
				pipeline: z.string().describe("Pipeline slug, from list_pipelines."),
				workspace: WORKSPACE_ARG,
			},
			annotations: { readOnlyHint: false, destructiveHint: false },
		},
		async ({ path, pipeline, workspace }, extra) =>
			guard(async () => {
				const slug = ctx.workspace(workspace);

				// Each stage reports what already happened, so a failure part way
				// through says what exists in the workspace rather than just failing.
				const file = await uploadFrom(ctx, slug, path);
				const uploaded = `Uploaded ${describeFile(file)}`;

				const { detection, unsettled } = await detectAndWait(
					ctx,
					slug,
					pipeline,
					file.id,
					extra,
				);

				if (unsettled) {
					return text(
						[
							uploaded,
							unsettled === "cancelled"
								? "Stopped waiting; the detection is still running."
								: "The detection is still running.",
							`detectionId: ${detection.id}`,
							"Call get_detection to check it, then apply_redaction.",
						].join("\n"),
					);
				}

				if (detection.status === "failed") {
					return text(
						[
							uploaded,
							`Detection failed: ${detection.error ?? "no reason given"}`,
						].join("\n"),
					);
				}

				const result = await ctx.client.detections.createRedaction(
					slug,
					detection.id,
					{},
				);

				return text(
					[
						uploaded,
						`Detected with ${pipeline} (detectionId ${detection.id}).`,
						describeResult(result.id, result.outputFileId),
						"Call get_analysis with the detection id to see what was found.",
					].join("\n"),
				);
			}),
	);
}

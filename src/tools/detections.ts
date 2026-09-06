/**
 * @fileoverview Detection tools: running a pipeline over a file and reading
 * what it found.
 *
 * @module tools/detections
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Detection } from "@nvisy/sdk/datatypes";
import { z } from "zod";
import type { Context } from "@/context.js";
import { guard, text } from "@/errors.js";
import { fields, list } from "@/format.js";
import { summarize } from "@/report.js";
import { AFTER_ARG, LIMIT_ARG, WORKSPACE_ARG } from "@/tools/common.js";

/** How long to wait between polls of a running detection. */
const POLL_INTERVAL_MS = 2_000;

/** How long `redact_file` waits before handing polling back to the caller. */
const POLL_TIMEOUT_MS = 120_000;

/** Detection states that will not change again. */
const SETTLED = new Set(["complete", "failed"]);

/** Renders a detection as one line. */
function describe(detection: Detection): string {
	return fields(
		["id", detection.id],
		["status", detection.status],
		["file", detection.inputFileName ?? detection.inputFileId],
		["pipeline", detection.pipelineSlug],
		["error", detection.error],
	);
}

/**
 * Resolves after the given delay, or as soon as the request is cancelled.
 *
 * @param ms - How long to wait
 * @param signal - Fires when the client cancels the tool call
 */
function delay(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve) => {
		const timer = setTimeout(finish, Math.max(0, ms));
		signal.addEventListener("abort", finish, { once: true });

		function finish(): void {
			clearTimeout(timer);
			signal.removeEventListener("abort", finish);
			resolve();
		}
	});
}

/**
 * Registers detection tools.
 *
 * @param server - The MCP server to register on
 * @param ctx - Shared tool context
 */
export function registerDetections(server: McpServer, ctx: Context): void {
	server.registerTool(
		"redact_file",
		{
			title: "Run a pipeline over a file",
			description:
				"Run a redaction pipeline over a file, detecting the sensitive " +
				"information the pipeline's policies look for. Waits for the run to " +
				"finish and returns the detection. This only finds entities; call " +
				"apply_redaction afterwards to produce a redacted file.",
			inputSchema: {
				fileId: z.string().describe("The file to analyse, from list_files."),
				pipeline: z.string().describe("Pipeline slug, from list_pipelines."),
				workspace: WORKSPACE_ARG,
			},
			annotations: { readOnlyHint: false, destructiveHint: false },
		},
		async ({ fileId, pipeline, workspace }, extra) =>
			guard(async () => {
				const slug = ctx.workspace(workspace);
				let detection = await ctx.client.detections.createDetection(
					slug,
					pipeline,
					{ fileId },
				);

				const progressToken = extra._meta?.progressToken;
				const started = Date.now();
				const deadline = started + POLL_TIMEOUT_MS;

				/** Reports how far into the poll window this run is. */
				const report = async (): Promise<void> => {
					if (progressToken === undefined) return;
					await extra.sendNotification({
						method: "notifications/progress",
						params: {
							progressToken,
							progress: Date.now() - started,
							total: POLL_TIMEOUT_MS,
							message: `Detection ${detection.status}`,
						},
					});
				};

				await report();

				while (
					!SETTLED.has(detection.status) &&
					Date.now() < deadline &&
					!extra.signal.aborted
				) {
					// Never sleep past the deadline, and re-check it afterwards so
					// the last interval cannot start one more request.
					const remaining = deadline - Date.now();
					await delay(Math.min(POLL_INTERVAL_MS, remaining), extra.signal);
					if (extra.signal.aborted || Date.now() >= deadline) break;

					detection = await ctx.client.detections.getDetection(
						slug,
						detection.id,
					);
					await report();
				}

				// The run keeps going server-side; hand back the id either way.
				if (extra.signal.aborted) {
					return text(
						`Stopped waiting; the detection is still running.\n${describe(detection)}`,
					);
				}

				if (!SETTLED.has(detection.status)) {
					return text(
						`Detection is still running after ${POLL_TIMEOUT_MS / 1000}s.\n` +
							`${describe(detection)}\n` +
							"Call get_detection with this id to check again.",
					);
				}

				if (detection.status === "failed") {
					return text(`Detection failed.\n${describe(detection)}`);
				}

				return text(
					`Detection complete.\n${describe(detection)}\n` +
						"Call get_analysis with this id to see what was found.",
				);
			}),
	);

	server.registerTool(
		"get_detection",
		{
			title: "Get a detection",
			description:
				"Get a detection's current status. Use this to poll a run that " +
				"redact_file left in progress.",
			inputSchema: {
				detectionId: z.string().describe("The detection to look up."),
				workspace: WORKSPACE_ARG,
			},
			annotations: { readOnlyHint: true, destructiveHint: false },
		},
		async ({ detectionId, workspace }) =>
			guard(async () => {
				const detection = await ctx.client.detections.getDetection(
					ctx.workspace(workspace),
					detectionId,
				);
				return text(describe(detection));
			}),
	);

	server.registerTool(
		"get_analysis",
		{
			title: "Get a detection's findings",
			description:
				"Summarise what a completed detection found, grouped by entity label " +
				"and modality. Returns counts and a sample rather than every entity, " +
				"because a large document can hold thousands.",
			inputSchema: {
				detectionId: z.string().describe("The detection to summarise."),
				modality: z
					.enum(["text", "image", "audio", "tabular"])
					.optional()
					.describe("Only report findings for this modality."),
				limit: z
					.number()
					.int()
					.min(1)
					.max(50)
					.optional()
					.describe("How many example entities to include (default 10)."),
				workspace: WORKSPACE_ARG,
			},
			annotations: { readOnlyHint: true, destructiveHint: false },
		},
		async ({ detectionId, modality, limit, workspace }) =>
			guard(async () => {
				const audit = await ctx.client.detections.getAnalysis(
					ctx.workspace(workspace),
					detectionId,
				);
				return text(summarize(audit, { modality, limit }));
			}),
	);

	server.registerTool(
		"list_detections",
		{
			title: "List detections",
			description: "List detection runs in a workspace, most recent first.",
			inputSchema: {
				workspace: WORKSPACE_ARG,
				status: z
					.enum(["pending", "executing", "complete", "failed"])
					.optional()
					.describe("Only list detections in this state."),
				limit: LIMIT_ARG,
				after: AFTER_ARG,
			},
			annotations: { readOnlyHint: true, destructiveHint: false },
		},
		async ({ workspace, status, limit, after }) =>
			guard(async () => {
				const page = await ctx.client.detections.listDetections(
					ctx.workspace(workspace),
					{ status, limit, after, includeCount: true },
				);
				return text(list(page, "detections", describe));
			}),
	);
}

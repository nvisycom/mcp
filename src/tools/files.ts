/**
 * @fileoverview File tools: listing a workspace's files and adding to them.
 *
 * @module tools/files
 */

import { openAsBlob } from "node:fs";
import { basename } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { File } from "@nvisy/sdk/datatypes";
import { z } from "zod";
import type { Context } from "@/context.js";
import { guard, text } from "@/errors.js";
import { fields, list } from "@/format.js";
import { resolveWithinAny } from "@/paths.js";
import { AFTER_ARG, LIMIT_ARG, WORKSPACE_ARG } from "@/tools/common.js";

/** Renders a byte count in the largest unit that keeps it readable. */
export function size(bytes: number): string {
	const units = ["B", "KB", "MB", "GB"];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)}${units[unit]}`;
}

/** Renders an uploaded file as one line. */
export function describeFile(file: File): string {
	return fields(
		["id", file.id],
		["name", file.displayName],
		["kind", file.fileKind],
		["size", size(file.fileSize)],
	);
}

/**
 * Uploads a file from the configured directory into a workspace.
 *
 * Shared with the `redact` tool, which uploads before detecting.
 *
 * @param ctx - Shared tool context
 * @param workspace - Resolved workspace slug
 * @param path - Caller-supplied path, relative to the configured root
 * @returns The uploaded file's metadata
 */
export async function uploadFrom(
	ctx: Context,
	workspace: string,
	path: string,
): Promise<File> {
	const resolved = await resolveWithinAny(await ctx.readableDirs(), path);
	const blob = await openAsBlob(resolved);
	const named = new globalThis.File([blob], basename(resolved), {
		type: blob.type,
	});

	const [uploaded] = await ctx.client.files.uploadFiles(workspace, named);
	if (!uploaded) {
		throw new Error(`Upload of ${basename(resolved)} returned no file.`);
	}
	return uploaded;
}

/**
 * Registers file tools.
 *
 * The upload tool is registered only when a root directory is configured.
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
				"List the files stored in a workspace, newest first. Use this to find " +
				"the fileId that detect needs.",
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
				return text(list(page, "files", describeFile));
			}),
	);

	server.registerTool(
		"upload_file",
		{
			title: "Upload a file",
			description:
				"Upload a file into a workspace so a pipeline can be run over it. " +
				"Paths are read from the directory this server is configured with, or " +
				"from the client's workspace when it reports one; files elsewhere " +
				"cannot be read.",
			inputSchema: {
				path: z
					.string()
					.describe(
						"Path to the file, absolute or relative to the workspace directory.",
					),
				workspace: WORKSPACE_ARG,
			},
			annotations: { readOnlyHint: false, destructiveHint: false },
		},
		async ({ path, workspace }) =>
			guard(async () => {
				const file = await uploadFrom(ctx, ctx.workspace(workspace), path);
				return text(`Uploaded.\n${describeFile(file)}`);
			}),
	);
}

/**
 * @fileoverview Translates SDK and runtime errors into MCP tool results.
 *
 * @module errors
 */

import { NvisyApiError } from "@nvisy/sdk";
import { ENV } from "@/config.js";

/** An MCP tool result carrying a single block of text. */
export interface TextResult {
	[key: string]: unknown;
	content: { type: "text"; text: string }[];
	isError?: boolean;
}

/**
 * Wraps text in a successful tool result.
 *
 * @param text - The text to return
 * @returns An MCP tool result
 */
export function text(text: string): TextResult {
	return { content: [{ type: "text", text }] };
}

/**
 * Renders an error as a failed tool result.
 *
 * API errors carry a suggestion and per-field validation messages; both are
 * surfaced so the model can correct the call rather than seeing a status code.
 *
 * @param error - The thrown value
 * @returns An MCP tool result flagged as an error
 */
export function failure(error: unknown): TextResult {
	return { content: [{ type: "text", text: describe(error) }], isError: true };
}

/**
 * Renders an error as a human-readable message.
 *
 * @param error - The thrown value
 * @returns A description of the error
 */
function describe(error: unknown): string {
	if (error instanceof NvisyApiError) {
		const lines = [`${error.message} (HTTP ${error.statusCode})`];

		if (error.resource) {
			lines.push(`Resource: ${error.resource}`);
		}
		if (error.suggestion) {
			lines.push(`Suggestion: ${error.suggestion}`);
		}
		for (const issue of error.validation ?? []) {
			lines.push(`Invalid ${issue.field}: ${issue.message}`);
		}

		return lines.join("\n");
	}

	// The SDK surfaces a transport failure as a bare "fetch failed", which
	// tells the model nothing it can act on. Name the likely causes instead.
	if (
		error instanceof Error &&
		/fetch failed|network|ENOTFOUND|ECONNREFUSED/i.test(error.message)
	) {
		return [
			`Could not reach the Nvisy API: ${error.message}.`,
			`Check network connectivity and that ${ENV.BASE_URL} points at a running API.`,
		].join("\n");
	}

	return error instanceof Error ? error.message : String(error);
}

/**
 * Runs a tool handler, converting a thrown error into an error result.
 *
 * MCP reports tool failures in the result rather than as protocol errors, so
 * the model can read what went wrong and retry.
 *
 * @param handler - The handler to run
 * @returns The handler's result, or an error result if it threw
 */
export async function guard(
	handler: () => Promise<TextResult>,
): Promise<TextResult> {
	try {
		return await handler();
	} catch (error) {
		return failure(error);
	}
}

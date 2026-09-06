/**
 * @fileoverview Argument schemas shared across tools.
 *
 * @module tools/common
 */

import { z } from "zod";

/**
 * The workspace a tool call acts on.
 *
 * Optional everywhere: the server falls back to `NVISY_WORKSPACE`, and errors
 * with instructions when neither is available.
 */
export const WORKSPACE_ARG = z
	.string()
	.optional()
	.describe(
		"Workspace slug. Defaults to the server's configured workspace; call " +
			"list_workspaces if you do not know it.",
	);

/** The page size for a paginated listing. */
export const LIMIT_ARG = z
	.number()
	.int()
	.min(1)
	.max(100)
	.optional()
	.describe("Maximum records to return (1-100).");

/** The cursor continuing a previous listing. */
export const AFTER_ARG = z
	.string()
	.optional()
	.describe("Cursor from a previous result, to fetch the next page.");

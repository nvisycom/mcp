/**
 * @fileoverview Confines model-supplied file paths to a configured root.
 *
 * A tool that reads a path chosen by a model is an exfiltration risk: asked to
 * "upload my config", it would happily send credentials to the API. Uploads are
 * therefore only available when a root directory is configured, and every path
 * is resolved through the filesystem — symlinks included — before it is read.
 *
 * @module paths
 */

import { realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ENV } from "@/config.js";

/**
 * Resolves a caller-supplied path within the configured root.
 *
 * Both the root and the target are resolved with `realpath`, so a symlink
 * pointing outside the root is rejected rather than followed.
 *
 * @param root - The directory uploads are confined to
 * @param input - The path supplied by the caller, absolute or root-relative
 * @returns The resolved absolute path
 * @throws {Error} If the file does not exist or lies outside the root
 */
export async function resolveWithin(
	root: string,
	input: string,
): Promise<string> {
	let base: string;
	try {
		base = await realpath(root);
	} catch {
		throw new Error(
			`${ENV.FILES_DIR} is set to "${root}", which does not exist.`,
		);
	}

	let target: string;
	try {
		target = await realpath(resolve(base, input));
	} catch {
		throw new Error(`No such file: ${input}`);
	}

	const rel = relative(base, target);
	if (rel !== "" && (rel.startsWith("..") || isAbsolute(rel))) {
		throw new Error(
			`Refusing to read "${input}": it resolves outside ${root}, ` +
				`the directory this server is allowed to read.`,
		);
	}

	return target;
}

/**
 * Converts client roots to filesystem paths.
 *
 * Roots are URIs, and a client may advertise ones that are not local
 * directories; anything that is not a `file:` URI is skipped rather than
 * widening what the server can read.
 *
 * @param roots - The roots reported by the client
 * @returns The local directories among them
 */
export function rootPaths(roots: { uri: string }[]): string[] {
	const paths: string[] = [];
	for (const root of roots) {
		try {
			paths.push(fileURLToPath(root.uri));
		} catch {
			// Not a file: URI, so not a directory this server can read.
		}
	}
	return paths;
}

/**
 * Resolves a caller-supplied path within any of the allowed roots.
 *
 * @param roots - The directories reads are confined to
 * @param input - The path supplied by the caller
 * @returns The resolved absolute path
 * @throws {Error} If no root contains the file
 */
export async function resolveWithinAny(
	roots: string[],
	input: string,
): Promise<string> {
	if (roots.length === 0) {
		throw new Error(
			`This server has no directory it is allowed to read. ` +
				`Set ${ENV.FILES_DIR} to the directory holding the files to upload.`,
		);
	}

	const failures: string[] = [];
	for (const root of roots) {
		try {
			return await resolveWithin(root, input);
		} catch (error) {
			failures.push(error instanceof Error ? error.message : String(error));
		}
	}

	// Every root rejected it; a single root reports its own reason verbatim.
	if (roots.length === 1) {
		throw new Error(failures[0]);
	}
	throw new Error(
		`Could not read "${input}" from any allowed directory: ${roots.join(", ")}.`,
	);
}

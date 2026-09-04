/**
 * @fileoverview Configuration for the Nvisy MCP server.
 *
 * @module config
 */

/**
 * Package version, replaced at build time by tsdown's `define`.
 *
 * Declared as a global rather than imported from `package.json` so the built
 * artifact carries no filesystem dependency.
 */
declare const __MCP_VERSION__: string | undefined;

/**
 * Resolves the package version.
 *
 * Returns the build-time injected version, falling back to `0.0.0` when
 * running from source (tests, `tsx`), where the define is not applied.
 *
 * @param injected - The injected version; defaults to the build-time global
 * @returns A semver string
 */
export function resolveVersion(
	injected: string | undefined = typeof __MCP_VERSION__ === "string"
		? __MCP_VERSION__
		: undefined,
): string {
	return injected ?? "0.0.0";
}

/** The version reported to MCP clients during the handshake. */
export const VERSION: string = resolveVersion();

/** The server name reported to MCP clients during the handshake. */
export const SERVER_NAME = "nvisy";

/** Environment variables read when no explicit configuration is supplied. */
export const ENV = {
	/** API token used to authenticate against the Nvisy API. */
	API_TOKEN: "NVISY_API_TOKEN",
	/** Base URL of the Nvisy API. */
	BASE_URL: "NVISY_BASE_URL",
} as const;

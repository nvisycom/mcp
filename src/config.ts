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
	/** Default workspace slug, overridable per tool call. */
	WORKSPACE: "NVISY_WORKSPACE",
	/** Directory uploads may read from; uploads are disabled when unset. */
	FILES_DIR: "NVISY_FILES_DIR",
} as const;

/** Resolved server configuration. */
export interface ServerConfig {
	/** API token used to authenticate against the Nvisy API. */
	apiToken: string;
	/** Base URL of the Nvisy API; omitted to use the SDK default. */
	baseUrl?: string;
	/** Default workspace slug applied when a tool call omits one. */
	workspace?: string;
	/** Directory uploads may read from; uploads are disabled when unset. */
	filesDir?: string;
}

/**
 * Reads server configuration from the environment.
 *
 * @param env - The environment to read; defaults to `process.env`
 * @returns The resolved configuration
 * @throws {Error} If the API token is missing
 */
export function configFromEnvironment(
	env: NodeJS.ProcessEnv = process.env,
): ServerConfig {
	const apiToken = env[ENV.API_TOKEN]?.trim();
	if (!apiToken) {
		throw new Error(
			`${ENV.API_TOKEN} is not set. Provide a Nvisy API token to start the server.`,
		);
	}

	return {
		apiToken,
		baseUrl: env[ENV.BASE_URL]?.trim() || undefined,
		workspace: env[ENV.WORKSPACE]?.trim() || undefined,
		filesDir: env[ENV.FILES_DIR]?.trim() || undefined,
	};
}

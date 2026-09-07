/**
 * @fileoverview Shared state handed to every tool handler.
 *
 * @module context
 */

import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Nvisy } from "@nvisy/sdk";
import { ENV, type ServerConfig } from "@/config.js";
import { rootPaths } from "@/paths.js";

/**
 * The state a tool handler needs: an authenticated client and the workspace
 * resolution rule.
 */
export class Context {
	/** Authenticated Nvisy API client. */
	readonly #client: Nvisy;

	/** Default workspace slug applied when a tool call omits one. */
	readonly #workspace: string | undefined;

	/** Directory uploads may read from; overrides the client's roots. */
	readonly #filesDir: string | undefined;

	/** The connected server, used to ask the client for its roots. */
	#server: Server | undefined;

	/**
	 * @param config - Resolved server configuration
	 */
	constructor(config: ServerConfig) {
		this.#client = new Nvisy({
			apiToken: config.apiToken,
			...(config.baseUrl ? { baseUrl: config.baseUrl } : {}),
		});
		this.#workspace = config.workspace;
		this.#filesDir = config.filesDir;
	}

	/**
	 * Attaches the server whose client is asked for roots.
	 *
	 * @param server - The low-level server backing the MCP server
	 */
	attach(server: Server): void {
		this.#server = server;
	}

	/**
	 * The directories a tool call may read from.
	 *
	 * An explicitly configured directory wins outright, so a client cannot widen
	 * what the operator allowed. Otherwise the client's roots are used, which
	 * makes uploads work unconfigured in clients that report a workspace.
	 *
	 * Resolved per call rather than cached: roots change while the server runs,
	 * and are unavailable until a client has connected.
	 *
	 * @returns The allowed directories, empty when neither source supplies any
	 */
	async readableDirs(): Promise<string[]> {
		if (this.#filesDir) {
			return [this.#filesDir];
		}

		const server = this.#server;
		if (!server?.getClientCapabilities()?.roots) {
			return [];
		}

		try {
			const { roots } = await server.listRoots();
			return rootPaths(roots);
		} catch {
			// A client may advertise roots and still fail to serve them.
			return [];
		}
	}

	/** The authenticated Nvisy API client. */
	get client(): Nvisy {
		return this.#client;
	}

	/**
	 * Resolves the workspace a tool call should act on.
	 *
	 * Prefers the slug the caller passed, falling back to the configured
	 * default. Throws rather than guessing when neither is available, so the
	 * model is told to list workspaces instead of acting on the wrong one.
	 *
	 * @param requested - The workspace slug passed to the tool, if any
	 * @returns The workspace slug to use
	 * @throws {Error} If no workspace was passed and none is configured
	 */
	workspace(requested?: string): string {
		const slug = requested?.trim() || this.#workspace;
		if (!slug) {
			throw new Error(
				`No workspace specified and ${ENV.WORKSPACE} is not set. ` +
					"Call list_workspaces and pass the workspace argument.",
			);
		}
		return slug;
	}
}

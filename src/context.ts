/**
 * @fileoverview Shared state handed to every tool handler.
 *
 * @module context
 */

import { Nvisy } from "@nvisy/sdk";
import { ENV, type ServerConfig } from "@/config.js";

/**
 * The state a tool handler needs: an authenticated client and the workspace
 * resolution rule.
 */
export class Context {
	/** Authenticated Nvisy API client. */
	readonly #client: Nvisy;

	/** Default workspace slug applied when a tool call omits one. */
	readonly #workspace: string | undefined;

	/**
	 * @param config - Resolved server configuration
	 */
	constructor(config: ServerConfig) {
		this.#client = new Nvisy({
			apiToken: config.apiToken,
			...(config.baseUrl ? { baseUrl: config.baseUrl } : {}),
		});
		this.#workspace = config.workspace;
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

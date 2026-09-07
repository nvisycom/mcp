/**
 * @fileoverview Pipeline tools: finding a pipeline and explaining what it does.
 *
 * @module tools/pipelines
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Policy } from "@nvisy/sdk/datatypes";
import { z } from "zod";
import type { Context } from "@/context.js";
import { guard, text } from "@/errors.js";
import { fields, list } from "@/format.js";
import { WORKSPACE_ARG } from "@/tools/common.js";

/**
 * Describes what a policy catches.
 *
 * The labels live in the policy's definition, which the listing endpoint does
 * not return; a policy summary alone says nothing about what it redacts.
 *
 * @param policy - The policy to describe
 * @returns The formatted lines
 */
function describePolicy(policy: Policy): string[] {
	const lines = [
		`  ${policy.slug}${policy.description ? ` — ${policy.description}` : ""}`,
	];

	const labels = new Set<string>();
	for (const scope of policy.definition.scopes ?? []) {
		for (const label of scope.labels) {
			labels.add(label);
		}
	}

	if (labels.size > 0) {
		lines.push(`    detects: ${[...labels].sort().join(", ")}`);
	}

	const rules = policy.definition.rules ?? [];
	if (rules.length > 0) {
		lines.push(`    rules: ${rules.map((rule) => rule.name).join(", ")}`);
	}

	if (labels.size === 0 && rules.length === 0) {
		lines.push("    no labels or rules defined");
	}

	return lines;
}

/**
 * Registers pipeline tools.
 *
 * @param server - The MCP server to register on
 * @param ctx - Shared tool context
 */
export function registerPipelines(server: McpServer, ctx: Context): void {
	server.registerTool(
		"list_pipelines",
		{
			title: "List pipelines",
			description:
				"List the redaction pipelines in a workspace. Use describe_pipeline to " +
				"see what one of them actually detects.",
			inputSchema: {
				workspace: WORKSPACE_ARG,
				search: z.string().optional().describe("Filter pipelines by name."),
			},
			annotations: { readOnlyHint: true, destructiveHint: false },
		},
		async ({ workspace, search }) =>
			guard(async () => {
				const page = await ctx.client.pipelines.listPipelines(
					ctx.workspace(workspace),
					search ? { search } : undefined,
				);
				return text(
					list(page, "pipelines", (pipeline) =>
						fields(
							["slug", pipeline.slug],
							["name", pipeline.displayName],
							["status", pipeline.status],
						),
					),
				);
			}),
	);

	server.registerTool(
		"describe_pipeline",
		{
			title: "Describe what a pipeline detects",
			description:
				"Explain what a pipeline would find in a document: the policies it " +
				"applies and the entity labels each of those detects. Use this to " +
				"choose a pipeline, or to answer whether a given kind of data would " +
				"be caught.",
			inputSchema: {
				pipeline: z.string().describe("Pipeline slug, from list_pipelines."),
				workspace: WORKSPACE_ARG,
			},
			annotations: { readOnlyHint: true, destructiveHint: false },
		},
		async ({ pipeline, workspace }) =>
			guard(async () => {
				const slug = ctx.workspace(workspace);
				const found = await ctx.client.pipelines.getPipeline(slug, pipeline);

				const lines = [
					fields(
						["pipeline", found.slug],
						["name", found.displayName],
						["status", found.status],
					),
				];
				if (found.description) {
					lines.push(found.description);
				}

				const policySlugs = found.definition.policySlugs ?? [];
				if (policySlugs.length === 0) {
					lines.push("\nNo policies attached: this pipeline detects nothing.");
					return text(lines.join("\n"));
				}

				// Fetched individually because a policy summary carries no definition,
				// and the definition is where the labels live.
				const policies = await Promise.all(
					policySlugs.map((policySlug) =>
						ctx.client.policies.getPolicy(slug, policySlug),
					),
				);

				lines.push(`\n${policies.length} policies:`);
				for (const policy of policies) {
					lines.push(...describePolicy(policy));
				}

				return text(lines.join("\n"));
			}),
	);
}

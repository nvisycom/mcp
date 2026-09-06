/**
 * @fileoverview Summarises a detection's report for the model.
 *
 * A report holds one entity per piece of sensitive information found, which on
 * a large document runs to thousands. Returning them all would exhaust the
 * context window and bury the answer, so this reports counts per label and a
 * capped sample.
 *
 * @module report
 */

import type { Audit } from "@nvisy/sdk/datatypes";

/** How many example entities to show when the caller does not say. */
const DEFAULT_SAMPLE = 10;

/** Options controlling what a summary includes. */
export interface SummaryOptions {
	/** Restrict the summary to a single modality. */
	modality?: string;
	/** How many example entities to include. */
	limit?: number;
}

/** The fields every entity shares, whatever its modality. */
interface Entity {
	id: string;
	label: string;
	confidence: number;
}

/**
 * Renders a detection's findings as counts per label plus a sample.
 *
 * @param audit - The analysis returned for a detection
 * @param options - Modality filter and sample size
 * @returns The formatted summary
 */
export function summarize(audit: Audit, options: SummaryOptions = {}): string {
	const parts = audit.report.parts.filter(
		(part) => !options.modality || part.modality === options.modality,
	);

	if (parts.length === 0) {
		return options.modality
			? `No ${options.modality} findings in this detection.`
			: "No findings in this detection.";
	}

	const lines: string[] = [];
	let total = 0;

	for (const part of parts) {
		const entities = part.entities as unknown as Entity[];
		total += entities.length;

		const counts = new Map<string, number>();
		for (const entity of entities) {
			counts.set(entity.label, (counts.get(entity.label) ?? 0) + 1);
		}

		lines.push(`\n${part.modality} — ${entities.length} entities:`);
		for (const [label, count] of [...counts].sort((a, b) => b[1] - a[1])) {
			lines.push(`  ${label}: ${count}`);
		}

		const sample = entities.slice(0, options.limit ?? DEFAULT_SAMPLE);
		if (sample.length > 0) {
			lines.push(`  examples:`);
			for (const entity of sample) {
				lines.push(
					`    ${entity.label} (confidence ${entity.confidence.toFixed(2)}) id=${entity.id}`,
				);
			}
			if (entities.length > sample.length) {
				lines.push(`    ... and ${entities.length - sample.length} more`);
			}
		}
	}

	return [`${total} entities found.`, ...lines].join("\n");
}

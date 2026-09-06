/**
 * @fileoverview Renders SDK payloads as compact text for the model.
 *
 * Tool results are read by a model, not parsed by a program, so these
 * formatters favour short labelled lines over raw JSON: less context spent,
 * and the salient fields are not buried.
 *
 * @module format
 */

/** A cursor-paginated SDK response. */
interface Page<T> {
	items: T[];
	nextCursor?: string;
	total?: number;
}

/**
 * Renders a page of records as a list, noting how to fetch the next page.
 *
 * @param page - The paginated response
 * @param noun - Plural noun describing the records, used when empty
 * @param render - Renders a single record as one line
 * @returns The formatted list
 */
export function list<T>(
	page: Page<T>,
	noun: string,
	render: (item: T) => string,
): string {
	if (page.items.length === 0) {
		return `No ${noun} found.`;
	}

	const lines = page.items.map((item) => `- ${render(item)}`);

	if (typeof page.total === "number") {
		lines.unshift(`${page.items.length} of ${page.total} ${noun}:`);
	} else {
		lines.unshift(`${page.items.length} ${noun}:`);
	}

	if (page.nextCursor) {
		lines.push(`More results: pass after="${page.nextCursor}".`);
	}

	return lines.join("\n");
}

/**
 * Joins labelled fields into one line, dropping empty ones.
 *
 * @param fields - Label/value pairs
 * @returns The formatted line
 */
export function fields(
	...fields: [string, string | number | undefined][]
): string {
	return fields
		.filter(([, value]) => value !== undefined && value !== "")
		.map(([label, value]) => `${label}: ${String(value)}`)
		.join("  ");
}

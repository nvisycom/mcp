import type { Audit } from "@nvisy/sdk/datatypes";
import { describe, expect, it } from "vitest";
import { summarize } from "@/report.js";

/** Builds an audit holding the given text entities. */
function auditOf(labels: string[]): Audit {
	return {
		report: {
			parts: [
				{
					modality: "text",
					id: ["part-1"],
					entities: labels.map((label, index) => ({
						id: `e${index}`,
						label,
						confidence: 0.9,
					})),
				},
			],
		},
	} as unknown as Audit;
}

describe("summarize", () => {
	it("reports counts per label, most frequent first", () => {
		const out = summarize(auditOf(["EMAIL", "PERSON", "PERSON"]));
		expect(out).toContain("3 entities found.");
		expect(out.indexOf("PERSON: 2")).toBeLessThan(out.indexOf("EMAIL: 1"));
	});

	it("caps the sample and says how many were withheld", () => {
		const out = summarize(auditOf(Array(25).fill("PERSON")), { limit: 5 });
		expect(out).toContain("PERSON: 25");
		expect(out).toContain("... and 20 more");
	});

	it("filters to a single modality", () => {
		expect(summarize(auditOf(["PERSON"]), { modality: "audio" })).toBe(
			"No audio findings in this detection.",
		);
	});

	it("reports an empty report", () => {
		const empty = { report: { parts: [] } } as unknown as Audit;
		expect(summarize(empty)).toBe("No findings in this detection.");
	});
});

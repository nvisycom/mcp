import { NvisyApiError } from "@nvisy/sdk";
import { describe, expect, it } from "vitest";
import { failure, guard, text } from "@/errors.js";

describe("text", () => {
	it("wraps a string in a successful result", () => {
		expect(text("hello")).toEqual({
			content: [{ type: "text", text: "hello" }],
		});
	});
});

describe("failure", () => {
	it("surfaces an API error's suggestion and validation", () => {
		const error = new NvisyApiError(
			{
				name: "ValidationError",
				message: "Invalid request",
				suggestion: "Check the pipeline slug",
				validation: [
					{ code: "unknown", field: "pipeline", message: "unknown pipeline" },
				],
			},
			422,
		);

		const result = failure(error);
		const rendered = result.content[0].text;

		expect(result.isError).toBe(true);
		expect(rendered).toContain("Invalid request");
		expect(rendered).toContain("422");
		expect(rendered).toContain("Check the pipeline slug");
		expect(rendered).toContain("unknown pipeline");
	});

	it("explains a transport failure instead of repeating it", () => {
		const rendered = failure(new Error("fetch failed")).content[0].text;
		expect(rendered).toContain("Could not reach the Nvisy API");
		expect(rendered).toContain("NVISY_BASE_URL");
	});

	it("renders a plain error", () => {
		expect(failure(new Error("boom")).content[0].text).toBe("boom");
	});
});

describe("guard", () => {
	it("returns the handler's result", async () => {
		await expect(guard(async () => text("ok"))).resolves.toEqual(text("ok"));
	});

	it("converts a thrown error into an error result", async () => {
		const result = await guard(async () => {
			throw new Error("boom");
		});
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toBe("boom");
	});
});

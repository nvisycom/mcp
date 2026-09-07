import { describe, expect, it } from "vitest";
import { size } from "@/tools/files.js";

describe("size", () => {
	it("keeps bytes whole", () => {
		expect(size(512)).toBe("512B");
	});

	it("shows one decimal for small multiples", () => {
		expect(size(1536)).toBe("1.5KB");
	});

	it("rounds larger values", () => {
		expect(size(50 * 1024 * 1024)).toBe("50MB");
	});

	it("stops at gigabytes", () => {
		expect(size(5 * 1024 ** 4)).toBe("5120GB");
	});
});

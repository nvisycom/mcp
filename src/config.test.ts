import { describe, expect, it } from "vitest";
import { ENV, resolveVersion, SERVER_NAME, VERSION } from "@/config.js";

describe("config", () => {
	it("exposes a server name", () => {
		expect(SERVER_NAME).toBe("nvisy");
	});

	it("exposes a semver-shaped version", () => {
		expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
	});

	it("names the environment variables read at startup", () => {
		expect(ENV.API_TOKEN).toBe("NVISY_API_TOKEN");
		expect(ENV.BASE_URL).toBe("NVISY_BASE_URL");
	});
});

describe("resolveVersion", () => {
	it("returns the injected build-time version", () => {
		expect(resolveVersion("1.2.3")).toBe("1.2.3");
	});

	it("falls back when no version was injected", () => {
		expect(resolveVersion(undefined)).toBe("0.0.0");
	});
});

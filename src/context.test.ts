import { describe, expect, it } from "vitest";
import { Context } from "@/context.js";

const TOKEN = "test-token-1234567890";

describe("Context.workspace", () => {
	it("prefers the requested workspace", () => {
		const ctx = new Context({ apiToken: TOKEN, workspace: "configured" });
		expect(ctx.workspace("requested")).toBe("requested");
	});

	it("falls back to the configured workspace", () => {
		const ctx = new Context({ apiToken: TOKEN, workspace: "configured" });
		expect(ctx.workspace()).toBe("configured");
	});

	it("ignores a blank request", () => {
		const ctx = new Context({ apiToken: TOKEN, workspace: "configured" });
		expect(ctx.workspace("   ")).toBe("configured");
	});

	it("directs the caller to list_workspaces when none is known", () => {
		const ctx = new Context({ apiToken: TOKEN });
		expect(() => ctx.workspace()).toThrow(/list_workspaces/);
	});
});

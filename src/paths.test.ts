import { mkdtemp, realpath, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { resolveWithin, resolveWithinAny, rootPaths } from "@/paths.js";

let root: string;
let outside: string;

beforeAll(async () => {
	const base = await realpath(await mkdtemp(join(tmpdir(), "nvisy-")));
	root = join(base, "root");
	outside = join(base, "outside.txt");

	await writeFile(outside, "secret");
	await mkdtemp(root).catch(() => {});
	const { mkdir } = await import("node:fs/promises");
	await mkdir(join(root, "sub"), { recursive: true });
	await writeFile(join(root, "file.txt"), "ok");
	await symlink(outside, join(root, "escape.txt"));
});

describe("resolveWithin", () => {
	it("allows a file inside the root", async () => {
		await expect(resolveWithin(root, "file.txt")).resolves.toContain(
			"file.txt",
		);
	});

	it("allows a path that traverses but stays inside", async () => {
		await expect(resolveWithin(root, "sub/../file.txt")).resolves.toContain(
			"file.txt",
		);
	});

	it("rejects traversal above the root", async () => {
		await expect(resolveWithin(root, "../outside.txt")).rejects.toThrow(
			/outside/,
		);
	});

	it("rejects an absolute path elsewhere", async () => {
		await expect(resolveWithin(root, "/etc/hosts")).rejects.toThrow(/outside/);
	});

	it("rejects a symlink pointing outside the root", async () => {
		await expect(resolveWithin(root, "escape.txt")).rejects.toThrow(/outside/);
	});

	it("reports a missing file", async () => {
		await expect(resolveWithin(root, "nope.txt")).rejects.toThrow(
			/No such file/,
		);
	});

	it("reports a misconfigured root", async () => {
		await expect(resolveWithin("/nonexistent-root", "x")).rejects.toThrow(
			/NVISY_FILES_DIR/,
		);
	});
});

describe("rootPaths", () => {
	it("converts file URIs to paths", () => {
		expect(rootPaths([{ uri: "file:///tmp/a" }])).toEqual(["/tmp/a"]);
	});

	it("decodes percent-encoded segments", () => {
		expect(rootPaths([{ uri: "file:///tmp/my%20docs" }])).toEqual([
			"/tmp/my docs",
		]);
	});

	it("skips URIs that are not local directories", () => {
		expect(rootPaths([{ uri: "https://example.com/x" }])).toEqual([]);
	});
});

describe("resolveWithinAny", () => {
	it("accepts a file in any allowed root", async () => {
		await expect(
			resolveWithinAny(["/nonexistent", root], "file.txt"),
		).resolves.toContain("file.txt");
	});

	it("rejects a file in none of them", async () => {
		await expect(resolveWithinAny([root], "/etc/hosts")).rejects.toThrow(
			/outside/,
		);
	});

	it("explains when no directory is allowed at all", async () => {
		await expect(resolveWithinAny([], "file.txt")).rejects.toThrow(
			/NVISY_FILES_DIR/,
		);
	});
});

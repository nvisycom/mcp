import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";
import { Context } from "@/context.js";
import { registerDetections } from "@/tools/detections.js";

const TOKEN = "test-token-1234567890";

/** A detection in the given state. */
function detection(status: string) {
	return { id: "det-1", status, inputFileId: "f1", pipelineSlug: "p" };
}

/**
 * Registers the detection tools against a stubbed SDK client and returns the
 * `redact_file` handler.
 */
function harness(getDetection: () => unknown) {
	const ctx = new Context({ apiToken: TOKEN, workspace: "w" });
	const client = {
		detections: {
			createDetection: vi.fn(async () => detection("pending")),
			getDetection: vi.fn(async () => getDetection()),
		},
	};
	vi.spyOn(ctx, "client", "get").mockReturnValue(
		client as unknown as Context["client"],
	);

	const handlers = new Map<string, (args: never, extra: never) => unknown>();
	const server = {
		registerTool: (name: string, _config: unknown, cb: never) => {
			handlers.set(name, cb);
		},
	} as unknown as McpServer;

	registerDetections(server, ctx);
	return { client, call: handlers.get("redact_file") as never };
}

/** A stand-in for the SDK's notification sender. */
type Notify = (notification: unknown) => Promise<void>;

/** The `extra` argument the SDK hands a tool callback. */
function extra(signal: AbortSignal, notify: Notify = async () => {}) {
	return { signal, sendNotification: notify, _meta: { progressToken: 1 } };
}

describe("redact_file", () => {
	it("stops polling when the request is cancelled", async () => {
		const controller = new AbortController();
		const { client, call } = harness(() => detection("executing"));

		const pending = (
			call as unknown as (
				a: unknown,
				e: unknown,
			) => Promise<{
				content: { text: string }[];
			}>
		)({ fileId: "f1", pipeline: "p" }, extra(controller.signal));

		controller.abort();
		const result = await pending;

		expect(result.content[0].text).toContain("Stopped waiting");
		// One create, and at most a single poll before the abort was noticed.
		expect(client.detections.getDetection.mock.calls.length).toBeLessThan(2);
	});

	it("does not poll past the deadline", async () => {
		vi.useFakeTimers();
		try {
			const { client, call } = harness(() => detection("executing"));

			const pending = (
				call as unknown as (
					a: unknown,
					e: unknown,
				) => Promise<{
					content: { text: string }[];
				}>
			)({ fileId: "f1", pipeline: "p" }, extra(new AbortController().signal));

			// Run out the whole poll window.
			await vi.advanceTimersByTimeAsync(200_000);
			const result = await pending;

			expect(result.content[0].text).toContain("still running");

			// The last interval ends exactly on the deadline, so the 60th poll
			// must not be issued: 120s of 2s intervals leaves 59.
			expect(client.detections.getDetection).toHaveBeenCalledTimes(59);
		} finally {
			vi.useRealTimers();
		}
	});

	it("reports progress while the detection runs", async () => {
		const notify = vi.fn<Notify>(async () => {});
		const { call } = harness(() => detection("complete"));

		await (call as unknown as (a: unknown, e: unknown) => Promise<unknown>)(
			{ fileId: "f1", pipeline: "p" },
			extra(new AbortController().signal, notify),
		);

		expect(notify).toHaveBeenCalled();
		expect(notify.mock.calls[0][0]).toMatchObject({
			method: "notifications/progress",
			params: { progressToken: 1 },
		});
	});
});

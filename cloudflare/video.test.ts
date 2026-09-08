import { expect, it } from "vitest";
import { videoRange } from "./video";

function response() {
	return new Response("0123456789", { headers: { "content-length": "10", "content-type": "video/mp4", etag: '"v1"' } });
}

it("advertises range support for the full video", async () => {
	const result = videoRange(new Request("https://example.com/video"), response());
	expect(result.headers.get("accept-ranges")).toBe("bytes");
	expect(await result.text()).toBe("0123456789");
});

it.each([
	["bytes=2-5", 206, "2345", "bytes 2-5/10"],
	["bytes=7-", 206, "789", "bytes 7-9/10"],
	["bytes=-3", 206, "789", "bytes 7-9/10"],
	["bytes=8-99", 206, "89", "bytes 8-9/10"],
	["bytes=10-", 416, "", "bytes */10"],
	["bytes=-0", 416, "", "bytes */10"],
] as const)("serves %s", async (range, status, body, contentRange) => {
	const result = videoRange(new Request("https://example.com/video", { headers: { range } }), response());
	expect(result.status).toBe(status);
	expect(result.headers.get("content-range")).toBe(contentRange);
	expect(result.headers.get("content-length")).toBe(String(body.length));
	expect(await result.text()).toBe(body);
});

it("keeps the full response when If-Range does not match", () => {
	const original = response();
	expect(videoRange(new Request("https://example.com/video", { headers: { range: "bytes=0-1", "if-range": '"v0"' } }), original)).toBe(original);
});

it("streams across chunks and cancels the unused upstream body", async () => {
	let cancelled = false;
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new TextEncoder().encode("012"));
			controller.enqueue(new TextEncoder().encode("3456789"));
		},
		cancel() { cancelled = true; },
	});
	const result = videoRange(new Request("https://example.com/video", { headers: { range: "bytes=2-5" } }), new Response(stream, { headers: { "content-length": "10" } }));
	expect(await result.text()).toBe("2345");
	expect(cancelled).toBe(true);
});

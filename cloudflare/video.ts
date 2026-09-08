// Nitro serves the large video as a full response. Stream byte ranges at the edge
// so browsers can seek without buffering the whole file in a Worker.
export function videoRange(request: Request, response: Response): Response {
	if (request.method !== "GET" || response.status !== 200 || !response.body) return response;
	const range = request.headers.get("range");
	const length = Number(response.headers.get("content-length"));
	if (!Number.isSafeInteger(length) || length <= 0) return response;
	if (!range) {
		const full = new Response(response.body, response);
		full.headers.set("accept-ranges", "bytes");
		return full;
	}
	const ifRange = request.headers.get("if-range");
	if (ifRange && ifRange !== response.headers.get("etag") && ifRange !== response.headers.get("last-modified")) return response;
	const match = /^bytes=(\d*)-(\d*)$/.exec(range);
	if (!match || (!match[1] && !match[2])) return response;
	const start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]));
	const end = match[1] && match[2] ? Math.min(length - 1, Number(match[2])) : length - 1;
	const headers = new Headers(response.headers);
	headers.set("accept-ranges", "bytes");
	if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= length || start > end) {
		void response.body.cancel();
		headers.set("content-range", `bytes */${length}`);
		headers.set("content-length", "0");
		return new Response(null, { status: 416, headers });
	}
	let skip = start;
	let remaining = end - start + 1;
	const reader = response.body.getReader();
	const body = new ReadableStream<Uint8Array>({
		async pull(controller) {
			while (remaining > 0) {
				const { done, value } = await reader.read();
				if (done) { controller.error(new Error("Video stream ended early")); return; }
				if (skip >= value.byteLength) { skip -= value.byteLength; continue; }
				const chunk = value.subarray(skip, Math.min(value.byteLength, skip + remaining));
				skip = 0;
				remaining -= chunk.byteLength;
				controller.enqueue(chunk);
				if (remaining === 0) { controller.close(); await reader.cancel(); }
				return;
			}
		},
		cancel(reason) { return reader.cancel(reason); },
	});
	headers.set("content-range", `bytes ${start}-${end}/${length}`);
	headers.set("content-length", String(end - start + 1));
	return new Response(body, { status: 206, headers });
}

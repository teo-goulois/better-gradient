export type RasterFormat = "png" | "webp";

type RasterOptions = {
	format: RasterFormat;
	quality?: number;
};

const DEFAULT_WEBP_QUALITY = 95;

function normalizeQuality(value?: number): number {
	if (value === undefined || Number.isNaN(value)) {
		return DEFAULT_WEBP_QUALITY;
	}
	if (value <= 1) {
		return Math.max(1, Math.min(100, Math.round(value * 100)));
	}
	return Math.max(1, Math.min(100, Math.round(value)));
}

export async function rasterizeSvg(
	svg: string,
	options: RasterOptions,
): Promise<Buffer> {
	if (process.env.BETTER_GRADIENT_RUNTIME === "worker") {
		throw new Error("PNG/WebP API requests must use Browser Run.");
	}
	const { default: sharp } = await import("sharp");
	const pipeline = sharp(Buffer.from(svg));
	if (options.format === "png") {
		return pipeline.png().toBuffer();
	}
	const quality = normalizeQuality(options.quality);
	return pipeline.webp({ quality }).toBuffer();
}

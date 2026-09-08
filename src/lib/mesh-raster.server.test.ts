import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { rasterizeSvg } from "./mesh-raster.server";
import { svgStringFromState } from "./mesh-svg";

const svg = svgStringFromState({
	canvas: {
		width: 128,
		height: 96,
		background: { id: "bg", color: "#ffffff" },
		backgroundMode: "transparent",
	},
	palette: [{ id: "red", color: "#ff0000" }],
	shapes: [
		{
			id: "shape",
			fillIndex: 0,
			points: [
				{ x: 40, y: 30 },
				{ x: 80, y: 30 },
				{ x: 60, y: 70 },
			],
		},
	],
	filters: { blur: 4, grainEnabled: true, grain: 0.1, opacity: 1, spread: 100 },
});

describe("native image exports", () => {
	it.each(["png", "webp"] as const)(
		"renders %s with SVG filters and transparency",
		async (format) => {
			const output = await rasterizeSvg(svg, { format });
			const metadata = await sharp(output).metadata();
			expect(metadata).toMatchObject({
				format,
				width: 128,
				height: 96,
				hasAlpha: true,
			});
			const { data } = await sharp(output)
				.ensureAlpha()
				.raw()
				.toBuffer({ resolveWithObject: true });
			expect(data.some((value, index) => index % 4 === 3 && value < 255)).toBe(
				true,
			);
		},
	);

	it("accepts both fractional and percentage WebP quality", async () => {
		const fraction = await rasterizeSvg(svg, { format: "webp", quality: 0.8 });
		const percent = await rasterizeSvg(svg, { format: "webp", quality: 80 });
		expect(fraction.equals(percent)).toBe(true);
	});
});

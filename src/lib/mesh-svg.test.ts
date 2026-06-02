import type {
	BlobShape,
	CanvasSettings,
	Filters,
	RgbHex,
} from "@/types/types.mesh";
import { describe, expect, it } from "vitest";
import { svgStringFromState } from "./mesh-svg";

const palette: RgbHex[] = [
	{ id: "bg", color: "#ffffff" },
	{ id: "shape", color: "#ff0000" },
];

const shape: BlobShape = {
	id: "shape",
	fillIndex: 1,
	points: [
		{ x: 10, y: 10 },
		{ x: 90, y: 10 },
		{ x: 90, y: 90 },
		{ x: 10, y: 90 },
	],
};

const filters: Filters = {
	blur: 0,
	grainEnabled: false,
	grain: 0.65,
	opacity: 100,
	spread: 100,
};

const canvas: CanvasSettings = {
	width: 100,
	height: 100,
	background: palette[0],
	backgroundMode: "solid",
};

describe("svgStringFromState", () => {
	it("renders a solid canvas background by default", () => {
		const svg = svgStringFromState({
			canvas,
			shapes: [shape],
			palette,
			filters,
		});

		expect(svg).toContain('<rect width="100" height="100" fill="#ffffff"/>');
	});

	it("omits the canvas background when background mode is transparent", () => {
		const svg = svgStringFromState({
			canvas: { ...canvas, backgroundMode: "transparent" },
			shapes: [shape],
			palette,
			filters,
		});

		expect(svg).not.toContain('fill="#ffffff"');
		expect(svg).toContain('fill="#ff0000"');
	});

	it("removes grain when requested for transparent exports", () => {
		const svg = svgStringFromState({
			canvas: { ...canvas, backgroundMode: "transparent" },
			shapes: [shape],
			palette,
			filters: { ...filters, grainEnabled: true },
			grainMode: "remove",
		});

		expect(svg).not.toContain('id="grain"');
		expect(svg).not.toContain('filter="url(#grain)"');
	});

	it("keeps grain when requested for transparent exports", () => {
		const svg = svgStringFromState({
			canvas: { ...canvas, backgroundMode: "transparent" },
			shapes: [shape],
			palette,
			filters: { ...filters, grainEnabled: true },
			grainMode: "keep",
		});

		expect(svg).toContain('id="grain"');
		expect(svg).toContain('filter="url(#grain)"');
	});
});

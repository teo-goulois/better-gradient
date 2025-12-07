// Types
export type RgbHex = {
	id: string;
	color: `#${string}`;
};

export type Point = { x: number; y: number };

export type BlobShape = {
	id: string;
	points: Point[];
	fillIndex: number; // index in palette (includes background at index 0)
	opacity?: number; // 0..1 (default 1)
	blur?: number; // px override; falls back to global filters.blur when undefined
};

export type Filters = {
	blur: number;
	grainEnabled: boolean;
	grain: number; // 0..1
	opacity: number; // 0..100
	spread: number; // 0..100
};

export type CanvasSettings = {
	width: number;
	height: number;
	background: RgbHex;
};

export type FrameRect = {
	x: number;
	y: number;
	width: number;
	height: number;
	aspectRatio?: number;
};

export type ContainerSize = { width: number; height: number };

export type TextElement = {
	id: string;
	content: string;
	x: number;
	y: number;
	fontSize: number;
	fontFamily: string;
	fontWeight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
	textAlign: "left" | "center" | "right";
	color: string; // hex color
	opacity: number; // 0..1
	maxWidth?: number; // optional max width for text wrapping
	stroke?: {
		color: string;
		width: number;
	};
	shadow?: {
		offsetX: number;
		offsetY: number;
		blur: number;
		color: string;
	};
};

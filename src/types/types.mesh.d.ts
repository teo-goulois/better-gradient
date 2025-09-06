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
};

export type Filters = {
	blur: number;
	grainEnabled: boolean;
	grain: number; // 0..1
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

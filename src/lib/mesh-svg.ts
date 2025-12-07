import type {
	BlobShape,
	CanvasSettings,
	Filters,
	Point,
	RgbHex,
	TextElement,
} from "@/types/types.mesh";

// Convert points to SVG path data
export function pathDataFromPoints(points: Point[]): string {
	if (points.length === 0) return "";
	const [first, ...rest] = points;
	const move = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
	const lines = rest
		.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
		.join(" ");
	return `${move} ${lines} Z`;
}

// Filter padding to avoid clipping
export function filterPaddingPx(blurPx: number): number {
	// 2x blur radius padding is generally safe
	return Math.max(blurPx * 2, 64);
}

// Generate an SVG string from the state
export function svgStringFromState(args: {
	canvas: CanvasSettings;
	shapes: BlobShape[];
	palette: RgbHex[];
	filters: Filters;
	texts?: TextElement[];
	outputSize?: { width: number; height: number };
	includeVertices?: boolean;
	vertexSizePx?: number;
}): string {
	const { canvas, shapes, palette, filters, texts = [] } = args;

	const blur = Math.max(0, Math.min(filters.blur, 256));

	const wCanvas = canvas.width;
	const hCanvas = canvas.height;
	const wOut = args.outputSize?.width ?? wCanvas;
	const hOut = args.outputSize?.height ?? hCanvas;
	const pad = filterPaddingPx(blur);
	const includeVertices = !!args.includeVertices;
	const vertexSizePx = Math.max(2, Math.min(64, args.vertexSizePx ?? 16));
	const scaleX = wOut / wCanvas;
	const scaleY = hOut / hCanvas;
	const avgScale = (scaleX + scaleY) / 2;

	const svgParts: string[] = [];
	svgParts.push(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${wOut}" height="${hOut}" viewBox="0 0 ${wCanvas} ${hCanvas}" preserveAspectRatio="none">`,
	);
	// defs
	svgParts.push("<defs>");
	// Expand blur region to include off-canvas shapes so their blur bleeds correctly into the viewport
	let minX = 0;
	let minY = 0;
	let maxX = wCanvas;
	let maxY = hCanvas;
	if (shapes.length > 0) {
		minX = Math.min(0, ...shapes.flatMap((s) => s.points.map((p) => p.x)));
		minY = Math.min(0, ...shapes.flatMap((s) => s.points.map((p) => p.y)));
		maxX = Math.max(
			wCanvas,
			...shapes.flatMap((s) => s.points.map((p) => p.x)),
		);
		maxY = Math.max(
			hCanvas,
			...shapes.flatMap((s) => s.points.map((p) => p.y)),
		);
	}
	const filterX = Math.floor(Math.min(-pad, minX - pad));
	const filterY = Math.floor(Math.min(-pad, minY - pad));
	const filterW = Math.ceil(Math.max(wCanvas + pad * 2, maxX + pad) - filterX);
	const filterH = Math.ceil(Math.max(hCanvas + pad * 2, maxY + pad) - filterY);
	svgParts.push(
		`<filter id="blur" x="${filterX}" y="${filterY}" width="${filterW}" height="${filterH}" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="${blur}"/></filter>`,
	);

	if (filters.grainEnabled) {
		// Procedural grain filter using turbulence + specular lighting
		svgParts.push(
			`<filter id="grain" x="${filterX}" y="${filterY}" width="${filterW}" height="${filterH}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB">
				<feTurbulence type="fractalNoise" baseFrequency=".2" numOctaves="4" seed="15" stitchTiles="no-stitch" x="0" y="0" width="${wCanvas}" height="${hCanvas}" result="turbulence"/>
				<feSpecularLighting surfaceScale="10" specularConstant="1.21" specularExponent="20" lighting-color="#fff" x="0" y="0" width="${wCanvas}" height="${hCanvas}" in="turbulence" result="specularLighting">
					<feDistantLight azimuth="3" elevation="100"/>
				</feSpecularLighting>
			</filter>`,
		);
	}
	svgParts.push("</defs>");

	// Background rect to ensure coverage after blur
	svgParts.push(
		`<rect width="${wCanvas}" height="${hCanvas}" fill="${canvas.background.color}"/>`,
	);

	// Shapes: support per-shape blur override while preserving array order
	// 1) Ensure a filter exists for each blur value used
	const blurIdsByValue: Record<number, string> = {};
	const uniqueBlurs = Array.from(
		new Set(shapes.map((s) => Math.max(0, Math.min(s.blur ?? blur, 256)))),
	);
	for (const b of uniqueBlurs) {
		const id = b === blur ? "blur" : `blur_${b}`;
		blurIdsByValue[b] = id;
		if (id !== "blur") {
			// Additional blur filter definition
			svgParts.splice(
				// insert before </defs>
				svgParts.lastIndexOf("</defs>"),
				0,
				`<filter id="${id}" x="${filterX}" y="${filterY}" width="${filterW}" height="${filterH}" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="${b}"/></filter>`,
			);
		}
	}

	// 2) Render paths in the exact order of the shapes array, applying the appropriate filter per-path
	for (const s of shapes) {
		const b = Math.max(0, Math.min(s.blur ?? blur, 256));
		const filterId = blurIdsByValue[b] ?? "blur";
		const color = palette[s.fillIndex].color ?? palette[0].color ?? "#000000";
		const opacity = Math.max(0, Math.min(s.opacity ?? filters.opacity, 1));
		svgParts.push(
			`<path d="${pathDataFromPoints(s.points)}" fill="${color}" fill-opacity="${opacity}" filter="url(#${filterId})"/>`,
		);
	}

	// Optional vertices overlay (drawn on top)
	if (includeVertices) {
		const r = vertexSizePx / 2 / avgScale;
		for (const s of shapes) {
			for (const p of s.points) {
				const cx = p.x;
				const cy = p.y;
				// white filled circle with black stroke to match overlay style
				svgParts.push(
					`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>`,
				);
			}
		}
	}

	if (filters.grainEnabled) {
		const opacity = Math.max(0, Math.min(filters.grain, 1));
		svgParts.push(
			`<rect width="${wCanvas}" height="${hCanvas}" fill="#FFFFFF" filter="url(#grain)" opacity="${opacity}"/>`,
		);
	}

	// Render text elements on top of everything
	for (const text of texts) {
		const {
			id,
			content,
			x,
			y,
			fontSize,
			fontFamily,
			fontWeight,
			textAlign,
			color,
			opacity,
			stroke,
			shadow,
			maxWidth,
		} = text;

		// Build text element attributes
		// Match SVG text positioning to HTML: use fontSize * 0.85 as baseline offset
		const baselineOffset = fontSize * 0.85;
		const attrs: string[] = [
			`x="${x}"`,
			`y="${y + baselineOffset}"`,
			`font-size="${fontSize}"`,
			`font-family="${fontFamily.includes(" ") ? `'${fontFamily}'` : fontFamily}"`,
			`font-weight="${fontWeight}"`,
			`text-anchor="${textAlign === "center" ? "middle" : textAlign === "right" ? "end" : "start"}"`,
			`fill="${color}"`,
			`opacity="${opacity}"`,
		];

		// Add stroke if defined
		if (stroke) {
			attrs.push(`stroke="${stroke.color}"`);
			attrs.push(`stroke-width="${stroke.width}"`);
		}

		// Add shadow filter if defined
		let filterId: string | undefined;
		if (shadow) {
			filterId = `text-shadow-${id}`;
			const { offsetX, offsetY, blur, color: shadowColor } = shadow;
			// Insert shadow filter definition before </defs>
			const shadowFilter = `<filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" />
				<feOffset dx="${offsetX}" dy="${offsetY}" result="offsetblur" />
				<feFlood flood-color="${shadowColor}" />
				<feComposite in2="offsetblur" operator="in" />
				<feMerge>
					<feMergeNode />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>`;
			svgParts.splice(svgParts.lastIndexOf("</defs>"), 0, shadowFilter);
			attrs.push(`filter="url(#${filterId})"`);
		}

		// Handle text with maxWidth - wrap text manually
		let lines: string[];
		if (maxWidth) {
			// Simple word wrapping approximation for SVG
			// Using average character width estimation: fontSize * 0.6
			const avgCharWidth = fontSize * 0.6;
			const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);

			lines = [];
			const paragraphs = content.split("\n");

			for (const paragraph of paragraphs) {
				if (paragraph.length <= maxCharsPerLine) {
					lines.push(paragraph);
				} else {
					// Break paragraph into words and wrap
					const words = paragraph.split(" ");
					let currentLine = "";

					for (const word of words) {
						const testLine = currentLine ? `${currentLine} ${word}` : word;

						if (testLine.length <= maxCharsPerLine) {
							currentLine = testLine;
						} else {
							if (currentLine) {
								lines.push(currentLine);
							}
							currentLine = word;
						}
					}

					if (currentLine) {
						lines.push(currentLine);
					}
				}
			}
		} else {
			// No maxWidth - split by newlines only
			lines = content.split("\n");
		}

		const lineHeight = fontSize * 1.2; // Match CSS line-height: normal

		if (lines.length === 1) {
			// Single line - simple text element
			const escapedContent = lines[0]
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&apos;");
			svgParts.push(`<text ${attrs.join(" ")}>${escapedContent}</text>`);
		} else {
			// Multiple lines - use tspan for each line
			svgParts.push(`<text ${attrs.join(" ")}>`);
			lines.forEach((line, index) => {
				const escapedLine = line
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;")
					.replace(/'/g, "&apos;");
				const dy = index === 0 ? "0" : lineHeight;
				svgParts.push(
					`<tspan x="${x}" dy="${dy}">${escapedLine || " "}</tspan>`,
				);
			});
			svgParts.push("</text>");
		}
	}

	svgParts.push("</svg>");
	return svgParts.join("");
}

export function svgDataUrl(svg: string): string {
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function cssBackgroundFromState(args: {
	canvas: CanvasSettings;
	shapes: BlobShape[];
	palette: RgbHex[];
	filters: Filters;
}): string {
	const svg = svgStringFromState({ ...args });
	const data = svgDataUrl(svg);
	return `background-image: url("${data}");\nbackground-size: cover;\nbackground-position: center;`;
}

// Generate a tiny noise PNG data URI (synchronous)
// Removed PNG noise in favor of SVG procedural grain filter

export async function svgToPngDataUrl(
	svg: string,
	scaleOrSize: number | { width: number; height: number; scale?: number } = 1,
): Promise<string> {
	const img = new Image();
	const url = svgDataUrl(svg);
	await new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = (e) => reject(e);
		img.src = url;
	});

	let width: number;
	let height: number;
	let scale = 1;
	if (typeof scaleOrSize === "number") {
		scale = scaleOrSize;
		width = Math.max(1, Math.round((img.width || 1) * scale));
		height = Math.max(1, Math.round((img.height || 1) * scale));
	} else {
		scale = scaleOrSize.scale ?? 1;
		width = Math.max(1, Math.round(scaleOrSize.width * scale));
		height = Math.max(1, Math.round(scaleOrSize.height * scale));
	}
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return canvas.toDataURL("image/png");
	}
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(img, 0, 0, width, height);
	return canvas.toDataURL("image/png");
}

export async function svgToWebpDataUrl(
	svg: string,
	scaleOrSize: number | { width: number; height: number; scale?: number } = 1,
	quality = 0.95,
): Promise<string> {
	const img = new Image();
	const url = svgDataUrl(svg);
	await new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = (e) => reject(e);
		img.src = url;
	});

	let width: number;
	let height: number;
	let scale = 1;
	if (typeof scaleOrSize === "number") {
		scale = scaleOrSize;
		width = Math.max(1, Math.round((img.width || 1) * scale));
		height = Math.max(1, Math.round((img.height || 1) * scale));
	} else {
		scale = scaleOrSize.scale ?? 1;
		width = Math.max(1, Math.round(scaleOrSize.width * scale));
		height = Math.max(1, Math.round(scaleOrSize.height * scale));
	}
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return canvas.toDataURL("image/webp", quality);
	}
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(img, 0, 0, width, height);
	return canvas.toDataURL("image/webp", quality);
}

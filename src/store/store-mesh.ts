import { DEFAULT_CANVAS, DEFAULT_FILTERS } from "@/lib/config/config.mesh";
import {
	clamp,
	deserialize,
	generateShapes,
	prng,
	serialize,
} from "@/lib/utils/utils.mesh";
import type {
	BlobShape,
	CanvasSettings,
	ContainerSize,
	Filters,
	FrameRect,
	Point,
	RgbHex,
} from "@/types/types.mesh";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type MeshState = {
	palette: RgbHex[];
	shapes: BlobShape[];
	filters: Filters;
	canvas: CanvasSettings;
	seed: string;
	selectedShapeId?: string;
	frame?: FrameRect;
	ui: {
		container?: ContainerSize;
		// vertices
		showCenters: boolean;
		showVertices: boolean;
		// settings
		maintainAspectRatio: boolean;
		// drag state
		isDragging: boolean;
	};

	// History
	_past: string[];
	_future: string[];

	// Actions
	randomize: (opts?: { seed?: string; count?: number }) => void;
	setPalette: (palette: RgbHex[]) => void;
	setFilters: (filters: Partial<Filters>) => void;
	setCanvas: (canvas: Partial<CanvasSettings>) => void;
	setShapes: (shapes: BlobShape[]) => void;
	moveShapeUp: (shapeId: string) => void;
	moveShapeDown: (shapeId: string) => void;
	shuffleColors: () => void;
	setSelectedShape: (id?: string) => void;
	setUi: (
		ui: Partial<MeshState["ui"]>,
		opts?: { history?: "push" | "replace" | "skip" },
	) => void;
	// UI - frame
	setUiFrameSize: (
		size: { width?: number; height?: number },
		opts?: { history?: "push" | "replace" | "skip" },
	) => void;
	setUiFrame: (
		size: Partial<FrameRect>,
		opts?: { history?: "push" | "replace" | "skip" },
	) => void;
	setUiFramePosition: (
		position: { x?: number; y?: number },
		opts?: { history?: "push" | "replace" | "skip" },
	) => void;
	setUiFrameTransform: (
		transform: { x?: number; y?: number; width?: number; height?: number },
		opts?: { history?: "push" | "replace" | "skip" },
	) => void;
	// Ui - contaier
	setUiContainerSize: (size: ContainerSize) => void;
	// shapes
	toggleAspectLock: (locked: boolean) => void;
	updateShape: (
		id: string,
		updater: (s: BlobShape) => BlobShape,
		opts?: { history?: "push" | "replace" | "skip" },
	) => void;
	undo: () => void;
	redo: () => void;
	toShareString: () => string;
	fromShareString: (encoded: string) => void;
};

export type MeshStoreActions = Pick<
	MeshState,
	| "randomize"
	| "setPalette"
	| "setFilters"
	| "setCanvas"
	| "setShapes"
	| "moveShapeUp"
	| "moveShapeDown"
	| "shuffleColors"
	| "setSelectedShape"
	| "setUi"
	| "updateShape"
	| "undo"
	| "redo"
	| "toShareString"
	| "fromShareString"
	| "setUiFrameSize"
	| "setUiFrame"
	| "setUiFramePosition"
	| "setUiFrameTransform"
	| "toggleAspectLock"
	| "setUiContainerSize"
>;

// Default initial content so the preview renders immediately on first load
const INITIAL_PALETTE = [
	{ id: crypto.randomUUID(), color: "#6d1d82" },
	{ id: crypto.randomUUID(), color: "#ef4444" },
	{ id: crypto.randomUUID(), color: "#ffffff" },
] as RgbHex[];

const INITIAL_SEED = "seed-1";
const INITIAL_SHAPES: BlobShape[] = generateShapes({
	seed: INITIAL_SEED,
	count: 6,
	canvas: DEFAULT_CANVAS,
	palette: INITIAL_PALETTE,
});

const initialStateBase: Omit<MeshState, keyof MeshStoreActions> = {
	palette: INITIAL_PALETTE,
	filters: DEFAULT_FILTERS,
	canvas: DEFAULT_CANVAS,
	seed: INITIAL_SEED,
	shapes: INITIAL_SHAPES,
	selectedShapeId: undefined as string | undefined,
	frame: undefined,
	ui: {
		container: undefined,
		showCenters: false,
		showVertices: false,
		maintainAspectRatio: true,
		isDragging: false,
	},
	_past: [] as string[],
	_future: [] as string[],
};

type HistoryMode = "push" | "replace";

export const useMeshStore = create<MeshState>()(
	persist(
		(set, get) => {
			const commit = (next: Partial<MeshState>, mode: HistoryMode = "push") => {
				const curr = get();
				const snapshot = serialize({
					palette: curr.palette,
					shapes: curr.shapes,
					filters: curr.filters,
					canvas: curr.canvas,
					seed: curr.seed,
					selectedShapeId: curr.selectedShapeId,
					frame: curr.frame,
					ui: curr.ui,
					_past: [],
					_future: [],
				});
				if (mode === "replace" && curr._past.length > 0) {
					const past = [...curr._past];
					past[past.length - 1] = snapshot;
					set({ _past: past, _future: [] });
				} else {
					set({ _past: [...curr._past, snapshot], _future: [] });
				}
				set(next);
			};

			const api: MeshStoreActions = {
				randomize: (opts) => {
					const curr = get();
					const nextSeed = opts?.seed ?? `${Date.now()}`;
					const count = clamp(
						opts?.count ?? Math.max(3, curr.shapes.length || 6),
						3,
						10,
					);
					const shapes = generateShapes({
						seed: nextSeed,
						count,
						canvas: curr.canvas,
						palette: curr.palette,
					});
					commit({ seed: nextSeed, shapes });
				},
				setPalette: (palette) => {
					const curr = get();
					// clamp shape fill indices in case palette shrunk
					const clampedShapes = curr.shapes.map((s) => ({
						...s,
						// Shapes index directly into full palette [0..length-1]
						fillIndex: Math.max(
							0,
							Math.min(s.fillIndex, Math.max(0, palette.length - 1)),
						),
					}));
					commit({
						palette,
						shapes: clampedShapes,
						canvas: {
							...curr.canvas,
							background: palette[0] ?? curr.canvas.background,
						},
					});
				},

				setFilters: (filters) => {
					const curr = get();
					commit({
						filters: {
							...curr.filters,
							...filters,
							blur: clamp(filters.blur ?? curr.filters.blur, 0, 256),
							grain: clamp(filters.grain ?? curr.filters.grain, 0, 1),
						},
					});
				},
				setCanvas: (canvas) => {
					const curr = get();
					const width = clamp(canvas.width ?? curr.canvas.width, 64, 6000);
					const height = clamp(canvas.height ?? curr.canvas.height, 64, 6000);
					commit({ canvas: { ...curr.canvas, ...canvas, width, height } });
				},
				setShapes: (shapes) => commit({ shapes }),
				moveShapeUp: (shapeId) => {
					const curr = get();
					const index = curr.shapes.findIndex((s) => s.id === shapeId);
					if (index > 0) {
						const shapes = [...curr.shapes];
						const [shape] = shapes.splice(index, 1);
						shapes.splice(index - 1, 0, shape);
						commit({ shapes });
					}
				},
				moveShapeDown: (shapeId) => {
					const curr = get();
					const index = curr.shapes.findIndex((s) => s.id === shapeId);
					if (index < curr.shapes.length - 1) {
						const shapes = [...curr.shapes];
						const [shape] = shapes.splice(index, 1);
						shapes.splice(index + 1, 0, shape);
						commit({ shapes });
					}
				},
				shuffleColors: () => {
					const curr = get();
					// Include changing entropy so repeated shuffles produce different results
					const entropy = `${curr._past.length}-${Date.now()}`;
					const r = prng(`${curr.seed}-shuffle-${entropy}`);
					// Shapes index into full palette; range is [0, palette.length - 1]
					const maxIndex = Math.max(0, curr.palette.length - 1);
					const shapes = curr.shapes.map((s) => ({
						...s,
						fillIndex: r.int(0, maxIndex),
					}));
					commit({ shapes });
				},
				setSelectedShape: (id) => set({ selectedShapeId: id }),
				setUi: (ui, opts = { history: "skip" }) => {
					const curr = get();
					const history = opts?.history ?? "push";

					if (history === "skip") {
						set({ ui: { ...curr.ui, ...ui } });
					} else {
						commit(
							{ ui: { ...curr.ui, ...ui } },
							history === "replace" ? "replace" : "push",
						);
					}
				},
				// UI - frame
				setUiFrame: (frame) => {
					set((state) => {
						if (!state.frame) return state;
						return {
							...state,
							frame: { ...state.frame, ...frame },
						};
					});
				},
				setUiFrameSize: (size, opts = { history: "push" }) => {
					const curr = get();
					const min = 50;
					const max = 6000;
					const w = size.width ?? curr.frame?.width ?? curr.canvas.width;
					const h = size.height ?? curr.frame?.height ?? curr.canvas.height;
					const locked = curr.ui.maintainAspectRatio;
					const ar =
						curr.frame?.aspectRatio ??
						(curr.frame?.width && curr.frame?.height
							? curr.frame?.width / curr.frame?.height
							: curr.canvas.width / curr.canvas.height);
					let nextW = clamp(w, min, max);
					let nextH = clamp(h, min, max);
					if (locked) {
						if (size.width !== undefined && size.height === undefined) {
							nextH = Math.round(nextW / Math.max(0.01, ar));
						} else if (size.height !== undefined && size.width === undefined) {
							nextW = Math.round(nextH * Math.max(0.01, ar));
						}
					}

					// Actually create the frame object with the new size
					const nextFrame = curr.frame
						? {
								...curr.frame,
								width: nextW,
								height: nextH,
							}
						: {
								x: 0,
								y: 0,
								width: nextW,
								height: nextH,
								aspectRatio: ar,
							};

					const history = opts?.history ?? "push";
					if (history === "skip") {
						set({ frame: nextFrame });
					} else {
						commit(
							{ frame: nextFrame },
							history === "replace" ? "replace" : "push",
						);
					}
				},
				setUiFramePosition: (position, opts) => {
					const history = opts?.history ?? "push";
					if (history === "skip") {
						// Optimize for drag operations - use functional update to avoid get()
						set((state) => {
							if (!state.frame) return state;
							return {
								...state,
								frame: {
									...state.frame,
									...position,
								},
							};
						});
					} else {
						const curr = get();
						if (!curr.frame) return;
						commit(
							{ frame: { ...curr.frame, ...position } },
							history === "replace" ? "replace" : "push",
						);
					}
				},
				setUiFrameTransform: (transform, opts) => {
					const history = opts?.history ?? "push";
					if (history === "skip") {
						// Optimize for zoom operations - use functional update to avoid get()
						set((state) => {
							if (!state.frame) return state;
							return {
								...state,
								frame: {
									...state.frame,
									...transform,
								},
							};
						});
					} else {
						const curr = get();
						if (!curr.frame) return;
						commit(
							{ frame: { ...curr.frame, ...transform } },
							history === "replace" ? "replace" : "push",
						);
					}
				},
				// UI - container
				setUiContainerSize: (size) => {
					set((state) => ({
						ui: {
							...state.ui,
							container: size,
						},
					}));
				},
				// shapes
				toggleAspectLock: (locked: boolean) =>
					set((state) => {
						const curr = state as MeshState;
						const w = curr.frame?.width ?? curr.canvas.width;
						const h = curr.frame?.height ?? curr.canvas.height;
						const ar = Math.max(0.01, w / h);
						return {
							...state,
							ui: {
								...curr.ui,
								maintainAspectRatio: locked,
							},
							frame: curr.frame
								? {
										...curr.frame,
										aspectRatio: locked ? ar : curr.frame.aspectRatio,
									}
								: curr.frame,
						};
					}),
				updateShape: (id, updater, opts) => {
					const curr = get();
					const shapes = curr.shapes.map((s) => (s.id === id ? updater(s) : s));
					const history = opts?.history ?? "push";
					if (history === "skip") {
						set({ shapes });
					} else {
						commit({ shapes }, history === "replace" ? "replace" : "push");
					}
				},
				undo: () => {
					const curr = get();

					const prev = curr._past.at(-1);
					if (!prev) return;
					const rest = curr._past.slice(0, -1);
					const present = serialize({
						palette: curr.palette,
						shapes: curr.shapes,
						filters: curr.filters,
						canvas: curr.canvas,
						seed: curr.seed,
						selectedShapeId: curr.selectedShapeId,
						frame: curr.frame,
						ui: curr.ui,
						_past: [],
						_future: [],
					});
					const parsed = deserialize(prev);
					set({
						...parsed,
						_past: rest,
						_future: [present, ...curr._future],
					} as Partial<MeshState> as MeshState);
				},
				redo: () => {
					const curr = get();
					const next = curr._future.at(0);
					if (!next) return;
					const future = curr._future.slice(1);
					const present = serialize({
						palette: curr.palette,
						shapes: curr.shapes,
						filters: curr.filters,
						canvas: curr.canvas,
						seed: curr.seed,
						selectedShapeId: curr.selectedShapeId,
						frame: curr.frame,
						ui: curr.ui,
						_past: [],
						_future: [],
					});
					const parsed = deserialize(next);
					set({
						...parsed,
						_past: [...curr._past, present],
						_future: future,
					} as Partial<MeshState> as MeshState);
				},
				toShareString: () => {
					const curr = get();
					const json = serialize({
						palette: curr.palette,
						shapes: curr.shapes,
						filters: curr.filters,
						canvas: curr.canvas,
						seed: curr.seed,
						selectedShapeId: undefined,
						frame: curr.frame,
						ui: curr.ui,
						_past: [],
						_future: [],
					});
					return btoa(unescape(encodeURIComponent(json)));
				},
				fromShareString: (encoded: string) => {
					try {
						const json = decodeURIComponent(escape(atob(encoded)));
						const data = JSON.parse(json);
						set({ ...initialStateBase, ...data });
					} catch (e) {
						// ignore malformed state
					}
				},
			};

			return {
				...initialStateBase,
				...api,
			} as unknown as MeshState;
		},
		{
			name: "mesh-storage",
			storage: createJSONStorage(() => localStorage),
			version: 1,
			partialize: (state) => ({
				palette: state.palette,
				shapes: state.shapes,
				filters: state.filters,
				canvas: state.canvas,
				seed: state.seed,
				frame: state.frame,
				ui: state.ui,
			}),
			onRehydrateStorage: () => (state) => {
				// Initialize shapes if empty
				const s = state as unknown as MeshState;
				if (s && (!s.shapes || s.shapes.length === 0)) {
					const shapes = generateShapes({
						seed: s.seed,
						count: 6,
						canvas: s.canvas ?? DEFAULT_CANVAS,
						palette: s.palette ?? [],
					});
					if (state) {
						state.shapes = shapes;
					}
				}
				/* if (s && (!s.ui || !s.ui.frame)) {
					s.ui.frame = {
						x: 0,
						y: 0,
						width: s.canvas?.width ?? DEFAULT_CANVAS.width,
						height: s.canvas?.height ?? DEFAULT_CANVAS.height,
					};
				} */
			},
		},
	),
);

export type {
	MeshState as MeshStore,
	BlobShape as MeshBlob,
	Point as MeshPoint,
};

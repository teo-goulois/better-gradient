import { useFrameContext } from "@/components/mesh/frame/frame-context";
import { type MeshState, useMeshStore } from "@/store/store-mesh";
import { useCallback, useEffect, useRef } from "react";

// Constants
const LEFT_MOUSE_BUTTON_MASK = 1;
const RESIZE_HANDLE_SELECTOR = "[data-resize]";
const HANDLE_ATTRIBUTE = '[data-handle="true"]';

// Types
type Props = {
	outerRef: React.RefObject<HTMLDivElement | null>;
};

type DragBoundaries = {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
};

type DragInitialState = {
	ui: MeshState["ui"];
	boundaries: DragBoundaries;
	startMousePos: { x: number; y: number };
	startFramePos: { x: number; y: number };
};

export const useFrameDragging = ({ outerRef }: Props) => {
	const { saveFrame, frame } = useFrameContext();

	// ===== STATE MANAGEMENT =====
	// Use refs to avoid stale closures and cache state
	const draggingRef = useRef(false);
	const rafIdRef = useRef<number | null>(null);
	const initialStateRef = useRef<DragInitialState | null>(null);
	const currentMousePosRef = useRef({ x: 0, y: 0 });
	const cleanupRef = useRef<(() => void) | null>(null);

	// ===== HELPER FUNCTIONS =====
	// Calculate the boundaries within which the frame can be dragged
	const calculateDragBoundaries = useCallback(
		(
			containerRect: { width: number; height: number },
			frameRect: { width: number; height: number },
		): DragBoundaries => {
			return {
				minX: Math.min(0, containerRect.width - frameRect.width),
				maxX: Math.max(0, containerRect.width - frameRect.width),
				minY: Math.min(0, containerRect.height - frameRect.height),
				maxY: Math.max(0, containerRect.height - frameRect.height),
			};
		},
		[],
	);

	// ===== DRAG POSITION CALCULATION =====
	// Calculate and apply the new frame position based on mouse movement
	const updatePosition = useCallback(() => {
		if (!initialStateRef.current || !draggingRef.current) return;

		const { boundaries, startMousePos, startFramePos } =
			initialStateRef.current;

		// Calculate mouse movement delta
		const deltaX = currentMousePosRef.current.x - startMousePos.x;
		const deltaY = currentMousePosRef.current.y - startMousePos.y;

		// Calculate new position
		let newX = startFramePos.x + deltaX;
		let newY = startFramePos.y + deltaY;

		// Constrain position within boundaries
		newX = Math.max(boundaries.minX, Math.min(newX, boundaries.maxX));
		newY = Math.max(boundaries.minY, Math.min(newY, boundaries.maxY));

		// Save the constrained position
		saveFrame({ x: newX, y: newY });

		rafIdRef.current = null;
	}, []);

	// ===== EVENT HANDLERS =====
	// Initialize drag operation when mouse is pressed
	const onMouseDown = useCallback(
		(e: MouseEvent) => {
			// Only respond to left mouse button
			if ((e.buttons & LEFT_MOUSE_BUTTON_MASK) !== LEFT_MOUSE_BUTTON_MASK)
				return;

			const target = e.target as Element;

			// Don't start dragging if clicking on resize handles or other interactive elements
			if (
				target.closest(RESIZE_HANDLE_SELECTOR) ||
				target.closest(HANDLE_ATTRIBUTE)
			) {
				return;
			}

			// Get current UI state from store
			const currentUiState = useMeshStore.getState().ui;
			if (!currentUiState.container) return;

			const containerRect = currentUiState.container;
			const currentFrame = frame;
			if (!currentFrame) return;

			// Calculate drag boundaries to keep frame within container
			const boundaries = calculateDragBoundaries(containerRect, currentFrame);

			// Store initial state for drag calculations
			initialStateRef.current = {
				ui: {
					...currentUiState,
				},
				boundaries,
				startMousePos: { x: e.clientX, y: e.clientY },
				startFramePos: { x: currentFrame.x, y: currentFrame.y },
			};

			// Start dragging
			draggingRef.current = true;
			currentMousePosRef.current = { x: e.clientX, y: e.clientY };

			// Disable CSS transitions during drag for smooth movement
			useMeshStore.setState((state) => ({
				ui: {
					...state.ui,
					isDragging: true,
				},
			}));
		},
		[frame, calculateDragBoundaries],
	);

	// Handle mouse movement during drag operation
	const onMouseMove = useCallback(
		(e: MouseEvent) => {
			// Only update position if actively dragging
			if (!draggingRef.current || !initialStateRef.current) return;

			// Update current mouse position
			currentMousePosRef.current = { x: e.clientX, y: e.clientY };

			// Throttle position updates using requestAnimationFrame for smooth performance
			if (rafIdRef.current === null) {
				rafIdRef.current = requestAnimationFrame(updatePosition);
			}
		},
		[updatePosition],
	);

	// Finalize drag operation when mouse is released
	const onMouseUp = useCallback(() => {
		// Only process if we were actively dragging
		if (draggingRef.current && initialStateRef.current) {
			// Cancel any pending animation frame update
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = null;
				// Apply final position immediately to ensure accuracy
				updatePosition();
			}

			// Save the final frame position
			const currentFrame = frame;
			if (currentFrame) {
				saveFrame({
					x: currentFrame.x,
					y: currentFrame.y,
				});
			}
		}

		// Reset drag state
		draggingRef.current = false;
		initialStateRef.current = null;

		// Re-enable CSS transitions now that dragging is complete
		useMeshStore.setState((state) => ({
			ui: {
				...state.ui,
				isDragging: false,
			},
		}));
	}, [updatePosition, frame]);

	// ===== LISTENER MANAGEMENT =====
	// Attach mouse event listeners for drag functionality
	const attachListeners = useCallback(() => {
		const element = outerRef.current;
		if (!element) return false;

		// Add listeners for drag interactions
		element.addEventListener("mousedown", onMouseDown);
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);

		// Store cleanup function for later removal
		cleanupRef.current = () => {
			element.removeEventListener("mousedown", onMouseDown);
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};

		return true;
	}, [onMouseDown, onMouseMove, onMouseUp]);

	// Remove all mouse event listeners
	const detachListeners = useCallback(() => {
		if (cleanupRef.current) {
			cleanupRef.current();
			cleanupRef.current = null;
		}
	}, []);

	// ===== LIFECYCLE MANAGEMENT =====
	// Lifecycle effect to manage event listeners
	useEffect(() => {
		let retryRafId = 0;

		// Attempt to attach listeners, retrying until element is available
		const attemptListenerAttachment = () => {
			if (attachListeners()) {
				// Successfully attached listeners
				return;
			}
			// Element not ready, retry on next animation frame
			retryRafId = requestAnimationFrame(attemptListenerAttachment);
		};

		// Start attempting to attach listeners
		attemptListenerAttachment();

		// Cleanup function
		return () => {
			// Cancel any pending retry attempts
			if (retryRafId) {
				cancelAnimationFrame(retryRafId);
			}

			// Cancel any pending position updates
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = null;
			}

			// Remove all event listeners
			detachListeners();
		};
	}, [attachListeners, detachListeners]);
};

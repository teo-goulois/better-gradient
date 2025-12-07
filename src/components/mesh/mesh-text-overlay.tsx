"use client";

import { useMeshStore } from "@/store/store-mesh";
import type { TextElement } from "@/types/types.mesh";
import React, { useCallback, useRef, useState } from "react";

type Props = {
	contentRef: { current: HTMLDivElement | null };
};

export const MeshTextOverlay = ({ contentRef }: Props) => {
	const texts = useMeshStore((s) => s.texts);
	const canvasSettings = useMeshStore((s) => s.canvas);

	const getScale = useCallback(() => {
		const rect = contentRef.current?.getBoundingClientRect();
		if (!rect) return { scaleX: 1, scaleY: 1 };
		const scaleX = rect.width / canvasSettings.width;
		const scaleY = rect.height / canvasSettings.height;
		return { scaleX, scaleY };
	}, [contentRef, canvasSettings.width, canvasSettings.height]);

	return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{ zIndex: 100 }}
		>
			{texts.map((text) => (
				<TextElementOverlay
					key={text.id}
					text={text}
					getScale={getScale}
				/>
			))}
		</div>
	);
};

type TextElementOverlayProps = {
	text: TextElement;
	getScale: () => { scaleX: number; scaleY: number };
};

const TextElementOverlay = ({ text, getScale }: TextElementOverlayProps) => {
	const updateText = useMeshStore((s) => s.updateText);
	const selectedTextId = useMeshStore((s) => s.selectedTextId);
	const setSelectedText = useMeshStore((s) => s.setSelectedText);

	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(text.content);
	const textRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const isSelected = selectedTextId === text.id;

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();
			setSelectedText(text.id);
		},
		[text.id, setSelectedText],
	);

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();
			setIsEditing(true);
			setEditContent(text.content);
			setTimeout(() => {
				textareaRef.current?.focus();
				textareaRef.current?.select();
			}, 0);
		},
		[text.content],
	);

	const handleBlur = useCallback(() => {
		if (editContent.trim()) {
			updateText(text.id, (t) => ({ ...t, content: editContent }));
		}
		setIsEditing(false);
	}, [editContent, text.id, updateText]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleBlur();
			} else if (e.key === "Escape") {
				setEditContent(text.content);
				setIsEditing(false);
			}
		},
		[handleBlur, text.content],
	);

	const { scaleX, scaleY } = getScale();

	const textStyle: React.CSSProperties = {
		position: "absolute",
		left: `${text.x * scaleX}px`,
		top: `${text.y * scaleY}px`,
		fontSize: `${text.fontSize * scaleY}px`,
		fontFamily: text.fontFamily.includes(" ")
			? `"${text.fontFamily}"`
			: text.fontFamily,
		fontWeight: text.fontWeight,
		textAlign: text.textAlign,
		color: text.color,
		opacity: text.opacity,
		pointerEvents: "auto",
		userSelect: "none",
		whiteSpace: "pre-wrap",
		lineHeight: "normal",
		wordWrap: "break-word",
		overflowWrap: "break-word",
		maxWidth: text.maxWidth ? `${text.maxWidth * scaleX}px` : undefined,
		transform:
			text.textAlign === "center"
				? "translateX(-50%)"
				: text.textAlign === "right"
					? "translateX(-100%)"
					: undefined,
	};

	if (text.stroke) {
		textStyle.WebkitTextStroke = `${text.stroke.width}px ${text.stroke.color}`;
	}

	if (text.shadow) {
		textStyle.textShadow = `${text.shadow.offsetX}px ${text.shadow.offsetY}px ${text.shadow.blur}px ${text.shadow.color}`;
	}

	return (
		<div
			style={{
				position: "absolute",
				left: 0,
				top: 0,
			}}
		>
			{isEditing ? (
				<textarea
					ref={textareaRef}
					value={editContent}
					onChange={(e) => setEditContent(e.target.value)}
					onBlur={handleBlur}
					onKeyDown={handleKeyDown}
					style={{
						...textStyle,
						background: "rgba(255, 255, 255, 0.9)",
						border: "2px solid #4f46e5",
						outline: "none",
						resize: "none",
						padding: "4px 8px",
						borderRadius: "4px",
						minWidth: "100px",
						cursor: "text",
						userSelect: "text",
					}}
					rows={editContent.split("\n").length || 1}
				/>
			) : (
				<>
					<div
						ref={textRef}
						onClick={handleClick}
						onDoubleClick={handleDoubleClick}
						style={{
							...textStyle,
							cursor: isSelected ? "move" : "pointer",
						}}
					>
						{text.content}
					</div>
					{isSelected && (
						<SelectionBox text={text} getScale={getScale} textRef={textRef} />
					)}
				</>
			)}
		</div>
	);
};

type SelectionBoxProps = {
	text: TextElement;
	getScale: () => { scaleX: number; scaleY: number };
	textRef: React.RefObject<HTMLDivElement>;
};

const SelectionBox = ({ text, getScale, textRef }: SelectionBoxProps) => {
	const updateText = useMeshStore((s) => s.updateText);
	const [bounds, setBounds] = useState({ width: 0, height: 0, left: 0, top: 0 });

	React.useEffect(() => {
		if (textRef.current) {
			const rect = textRef.current.getBoundingClientRect();
			const parent = textRef.current.offsetParent?.getBoundingClientRect();
			setBounds({
				width: rect.width,
				height: rect.height,
				left: parent ? rect.left - parent.left : 0,
				top: parent ? rect.top - parent.top : 0,
			});
		}
	}, [textRef, text.content, text.fontSize, text.fontFamily, text.fontWeight, text.x, text.y, text.maxWidth]);

	const handleResize = useCallback(
		(direction: string) => (e: React.MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();

			const { scaleX, scaleY } = getScale();
			const startX = e.clientX;
			const startY = e.clientY;
			const startFontSize = text.fontSize;
			const startMaxWidth = text.maxWidth;

			const handleMouseMove = (moveEvent: MouseEvent) => {
				moveEvent.preventDefault();
				moveEvent.stopPropagation();

				const deltaX = (moveEvent.clientX - startX) / scaleX;
				const deltaY = (moveEvent.clientY - startY) / scaleY;

				const updates: Partial<TextElement> = {};

				// Horizontal resize (E, W) - update maxWidth
				if (direction === "e" || direction === "w") {
					const widthDelta = direction === "e" ? deltaX : -deltaX;
					const currentWidth = startMaxWidth || 400;
					const newWidth = Math.max(50, currentWidth + widthDelta);
					updates.maxWidth = newWidth;
				}
				// Vertical resize (N, S) - update fontSize
				else if (direction === "n" || direction === "s") {
					const scaleFactor = 0.5;
					const fontDelta = direction === "s" ? deltaY : -deltaY;
					const newFontSize = Math.max(
						8,
						Math.min(500, startFontSize + fontDelta * scaleFactor),
					);
					updates.fontSize = newFontSize;
				}
				// Corner resize - update both maxWidth and fontSize
				else {
					// Horizontal component
					const widthDelta = direction.includes("e") ? deltaX : -deltaX;
					const currentWidth = startMaxWidth || 400;
					const newWidth = Math.max(50, currentWidth + widthDelta);
					updates.maxWidth = newWidth;

					// Vertical component
					const scaleFactor = 0.5;
					const fontDelta = direction.includes("s") ? deltaY : -deltaY;
					const newFontSize = Math.max(
						8,
						Math.min(500, startFontSize + fontDelta * scaleFactor),
					);
					updates.fontSize = newFontSize;
				}

				updateText(
					text.id,
					(t) => ({
						...t,
						...updates,
					}),
					{ history: "skip" },
				);
			};

			const handleMouseUp = () => {
				updateText(text.id, (t) => t, { history: "push" });
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};

			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		},
		[text, getScale, updateText],
	);

	const handleDrag = useCallback(
		(e: React.MouseEvent) => {
			// Only drag if clicking on the box border, not handles
			if ((e.target as HTMLElement).dataset.handle) return;

			e.stopPropagation();
			e.preventDefault();

			const { scaleX, scaleY } = getScale();
			const startX = e.clientX;
			const startY = e.clientY;
			const startTextX = text.x;
			const startTextY = text.y;

			const handleMouseMove = (moveEvent: MouseEvent) => {
				moveEvent.preventDefault();
				moveEvent.stopPropagation();

				const dx = (moveEvent.clientX - startX) / scaleX;
				const dy = (moveEvent.clientY - startY) / scaleY;

				updateText(
					text.id,
					(t) => ({
						...t,
						x: startTextX + dx,
						y: startTextY + dy,
					}),
					{ history: "skip" },
				);
			};

			const handleMouseUp = () => {
				updateText(text.id, (t) => t, { history: "push" });
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};

			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		},
		[text, getScale, updateText],
	);

	const boxStyle: React.CSSProperties = {
		position: "absolute",
		left: `${bounds.left - 6}px`,
		top: `${bounds.top - 6}px`,
		width: `${bounds.width + 12}px`,
		height: `${bounds.height + 12}px`,
		border: "2px solid #4f46e5",
		borderRadius: "4px",
		pointerEvents: "auto",
		cursor: "move",
		boxSizing: "border-box",
	};

	const handleStyle: React.CSSProperties = {
		position: "absolute",
		width: "10px",
		height: "10px",
		background: "#ffffff",
		border: "2px solid #4f46e5",
		borderRadius: "2px",
		pointerEvents: "auto",
		boxSizing: "border-box",
	};

	const handles = [
		{
			name: "nw",
			style: { ...handleStyle, left: "-5px", top: "-5px", cursor: "nwse-resize" },
		},
		{
			name: "n",
			style: {
				...handleStyle,
				left: "50%",
				top: "-5px",
				transform: "translateX(-50%)",
				cursor: "ns-resize",
			},
		},
		{
			name: "ne",
			style: {
				...handleStyle,
				right: "-5px",
				top: "-5px",
				cursor: "nesw-resize",
			},
		},
		{
			name: "e",
			style: {
				...handleStyle,
				right: "-5px",
				top: "50%",
				transform: "translateY(-50%)",
				cursor: "ew-resize",
			},
		},
		{
			name: "se",
			style: {
				...handleStyle,
				right: "-5px",
				bottom: "-5px",
				cursor: "nwse-resize",
			},
		},
		{
			name: "s",
			style: {
				...handleStyle,
				left: "50%",
				bottom: "-5px",
				transform: "translateX(-50%)",
				cursor: "ns-resize",
			},
		},
		{
			name: "sw",
			style: {
				...handleStyle,
				left: "-5px",
				bottom: "-5px",
				cursor: "nesw-resize",
			},
		},
		{
			name: "w",
			style: {
				...handleStyle,
				left: "-5px",
				top: "50%",
				transform: "translateY(-50%)",
				cursor: "ew-resize",
			},
		},
	];

	return (
		<div style={boxStyle} onMouseDown={handleDrag}>
			{handles.map((handle) => (
				<div
					key={handle.name}
					data-handle={handle.name}
					style={handle.style}
					onMouseDown={handleResize(handle.name)}
				/>
			))}
		</div>
	);
};

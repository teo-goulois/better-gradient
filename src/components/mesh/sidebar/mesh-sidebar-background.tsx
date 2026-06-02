"use client";

import { Switch } from "@/components/ui/switch";
import { trackEvent } from "@/lib/tracking";
import { useMeshStore } from "@/store/store-mesh";
import type { RgbHex } from "@/types/types.mesh";
import { useRef } from "react";
import { twJoin } from "tailwind-merge";
import { MeshSidebarColorPicker } from "./mesh-sidebar-color-picker";

export const MeshSidebarBackground = () => {
	const canvas = useMeshStore((state) => state.canvas);
	const setCanvas = useMeshStore((state) => state.setCanvas);
	const lastColorChangeAtRef = useRef<number>(0);
	const isTransparent = canvas.backgroundMode === "transparent";

	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">Canvas background</p>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<MeshSidebarColorPicker
						isDisabled={isTransparent}
						value={canvas.background.color}
						onChange={(color) => {
							const value = color.toString("hex");
							const now = Date.now();
							const isNewSession =
								now - (lastColorChangeAtRef.current || 0) > 300;
							setCanvas(
								{
									background: {
										id: canvas.background.id,
										color: value,
									} as RgbHex,
								},
								{ history: isNewSession ? "push" : "replace" },
							);
							lastColorChangeAtRef.current = now;
							trackEvent(
								"Change Canvas Background",
								{
									background_mode: canvas.backgroundMode,
									new_color: value,
								},
								true,
							);
						}}
					/>
					<span
						className={twJoin(
							"text-sm text-muted-fg transition-opacity duration-200",
							isTransparent && "opacity-50",
						)}
					>
						Solid color
					</span>
				</div>
				<Switch
					className="font-semibold text-sm w-full"
					isSelected={isTransparent}
					onChange={(selected) => {
						setCanvas(
							{ backgroundMode: selected ? "transparent" : "solid" },
							{ history: "push" },
						);
						trackEvent(
							"Change Canvas Background Mode",
							{
								background_mode: selected ? "transparent" : "solid",
							},
							true,
						);
					}}
				>
					Transparent
				</Switch>
			</div>
		</div>
	);
};

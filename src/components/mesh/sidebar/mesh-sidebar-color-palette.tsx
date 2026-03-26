"use client";

import { Button, ButtonPrimitive } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { trackEvent } from "@/lib/tracking";
import { useMeshStore } from "@/store/store-mesh";
import type { RgbHex } from "@/types/types.mesh";
import { IconCircleQuestionmark, IconDownload, IconPlus } from "@intentui/icons";
import { useRef, useState } from "react";
import { MeshSidebarColorPicker } from "./mesh-sidebar-color-picker";

const hexColorRegex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function parseColorArray(input: string): string[] | null {
	const trimmed = input.trim();
	try {
		const parsed = JSON.parse(trimmed);
		if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 10) return null;
		if (!parsed.every((c: unknown) => typeof c === "string" && hexColorRegex.test(c))) return null;
		return parsed as string[];
	} catch {
		return null;
	}
}

const ImportPaletteButton = () => {
	const setPalette = useMeshStore((state) => state.setPalette);
	const [value, setValue] = useState("");
	const [error, setError] = useState("");
	const [isOpen, setIsOpen] = useState(false);

	const handleImport = () => {
		const colors = parseColorArray(value);
		if (!colors) {
			setError("Invalid format. Paste a JSON array of hex colors, e.g. [\"#ff0000\", \"#00ff00\"]");
			return;
		}
		const nextPalette = colors.map((color) => ({
			id: crypto.randomUUID(),
			color: color.toLowerCase(),
		})) as RgbHex[];
		setPalette(nextPalette, { history: "push" });
		trackEvent("Import Palette", { colors_count: nextPalette.length }, true);
		setValue("");
		setError("");
		setIsOpen(false);
	};

	return (
		<Popover isOpen={isOpen} onOpenChange={setIsOpen}>
			<Tooltip>
				<Tooltip.Trigger>
					<ButtonPrimitive className="cursor-pointer text-muted-fg hover:text-fg transition-colors">
						<IconDownload className="size-4" />
					</ButtonPrimitive>
				</Tooltip.Trigger>
				<Tooltip.Content>Import palette from array</Tooltip.Content>
			</Tooltip>
			<Popover.Content className="w-72" placement="bottom start">
				<Popover.Header>
					<Popover.Title>Import Palette</Popover.Title>
					<Popover.Description>
						Paste a JSON array of hex colors
					</Popover.Description>
				</Popover.Header>
				<Popover.Body className="space-y-2">
					<textarea
						className="w-full rounded-lg border bg-bg p-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
						rows={3}
						placeholder='["#03045e","#0077b6","#00b4d8","#90e0ef","#caf0f8"]'
						value={value}
						onChange={(e) => {
							setValue(e.target.value);
							setError("");
						}}
					/>
					{error && <p className="text-xs text-danger">{error}</p>}
					<p className="text-xs text-muted-fg">
						Need more colors? Check out{" "}
						<a
							href="https://coolors.co/?ref=60b6a6910c0d3c000a8d86c1"
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary underline hover:no-underline"
						>
							Coolors
						</a>
					</p>
				</Popover.Body>
				<Popover.Footer>
					<Popover.Close>Cancel</Popover.Close>
					<Button size="sm" onPress={handleImport}>
						Import
					</Button>
				</Popover.Footer>
			</Popover.Content>
		</Popover>
	);
};

export const MeshSidebarColorPalette = () => {
	const palette = useMeshStore((state) => state.palette);
	const setPalette = useMeshStore((state) => state.setPalette);

	return (
		<div className="space-y-2">
			<div className="text-sm font-medium flex items-center gap-2">
				<p className="">Palette</p>
				<Tooltip>
					<Tooltip.Trigger>
						<IconCircleQuestionmark className="size-4" />
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>
							<p>tips</p>
							<p>1. the first color is the background color</p>
							<p>2. add or remove colors to explore new blends</p>
						</p>
					</Tooltip.Content>
				</Tooltip>
				<ImportPaletteButton />
			</div>
			<div className="flex gap-2 flex-wrap">
				{palette.map((item, index) => (
					<ColorSwatchItem key={item.id} color={item} index={index} />
				))}
				{palette.length < 10 && (
					<Button
						intent="outline"
						isCircle
						size="sq-sm"
						onPress={() => {
							setPalette(
								[
									...palette,
									{ id: crypto.randomUUID(), color: "#ffffff" },
								] as RgbHex[],
								{ history: "push" },
							);
							trackEvent(
								"Add Color",
								{
									colors_count: palette.length + 1,
								},
								true,
							);
						}}
					>
						<IconPlus className="size-4" />
					</Button>
				)}
			</div>
		</div>
	);
};

type ColorSwatchItemProps = {
	color: RgbHex;
	index: number;
};

const ColorSwatchItem = ({ color, index }: ColorSwatchItemProps) => {
	const palette = useMeshStore((state) => state.palette);
	const setPalette = useMeshStore((state) => state.setPalette);
	const lastColorChangeAtRef = useRef<number>(0);

	return (
		<div className="flex items-center gap-1 relative group transition-opacity duration-200">
			<MeshSidebarColorPicker
				value={color.color}
				onChange={(c) => {
					const value = c.toString("hex");
					const next = [...palette];
					next[index] = { id: color.id, color: value } as RgbHex;
					const now = Date.now();
					const isNewSession =
						now - (lastColorChangeAtRef.current || 0) > 300;
					setPalette(next as RgbHex[], {
						history: isNewSession ? "push" : "replace",
					});
					lastColorChangeAtRef.current = now;
					trackEvent(
						"Change Color",
						{
							color_index: index,
							new_color: value,
							colors_count: palette.length,
						},
						true,
					);
				}}
				onRemove={() => {
					if (palette.length === 1) return;
					setPalette(palette.filter((_, idx) => idx !== index) as RgbHex[], {
						history: "push",
					});
					trackEvent(
						"Remove Color",
						{
							color_index: index,
							colors_count: palette.length - 1,
						},
						true,
					);
				}}
			/>
		</div>
	);
};

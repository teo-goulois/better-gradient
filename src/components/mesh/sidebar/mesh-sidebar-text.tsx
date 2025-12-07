"use client";

import {
	Disclosure,
	DisclosurePanel,
	DisclosureTrigger,
} from "@/components/mesh/sidebar/mesh-sidebar-disclosure";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TextField } from "@/components/ui/text-field";
import { useMeshStore } from "@/store/store-mesh";
import { IconSparklesTwo } from "@intentui/icons";

const FONT_FAMILIES = [
	"Inter",
	"Roboto",
	"Playfair Display",
	"Montserrat",
	"Open Sans",
	"Lato",
	"Poppins",
	"Arial",
	"Georgia",
	"Times New Roman",
	"Courier New",
];

const FONT_WEIGHTS = [
	{ value: "100", label: "Thin" },
	{ value: "200", label: "Extra Light" },
	{ value: "300", label: "Light" },
	{ value: "normal", label: "Normal" },
	{ value: "500", label: "Medium" },
	{ value: "600", label: "Semi Bold" },
	{ value: "bold", label: "Bold" },
	{ value: "800", label: "Extra Bold" },
	{ value: "900", label: "Black" },
];

const TEXT_ALIGNS = [
	{ value: "left", label: "Left" },
	{ value: "center", label: "Center" },
	{ value: "right", label: "Right" },
];

export const MeshSidebarText = () => {
	const texts = useMeshStore((s) => s.texts);
	const selectedTextId = useMeshStore((s) => s.selectedTextId);
	const updateText = useMeshStore((s) => s.updateText);
	const removeText = useMeshStore((s) => s.removeText);

	const selectedText = texts.find((t) => t.id === selectedTextId);

	if (!selectedText) {
		return (
			<div>
				<Disclosure>
					<DisclosureTrigger>
						<IconSparklesTwo /> Text
					</DisclosureTrigger>
					<DisclosurePanel>
						<p className="text-sm text-muted-fg">
							Select a text element to edit its properties
						</p>
					</DisclosurePanel>
				</Disclosure>
			</div>
		);
	}

	return (
		<div>
			<Disclosure defaultExpanded>
				<DisclosureTrigger>
					<IconSparklesTwo /> Text
				</DisclosureTrigger>
				<DisclosurePanel>
					<div className="flex flex-col gap-4">
						{/* Content */}
						<TextField
							label="Content"
							value={selectedText.content}
							onChange={(value) => {
								updateText(selectedTextId, (t) => ({ ...t, content: value }));
							}}
						/>

						{/* Font Family */}
						<Select
							label="Font Family"
							selectedKey={selectedText.fontFamily}
							onSelectionChange={(key) => {
								updateText(selectedTextId, (t) => ({
									...t,
									fontFamily: String(key),
								}));
							}}
						>
							<Select.Trigger />
							<Select.Content
								items={FONT_FAMILIES.map((f) => ({ id: f, name: f }))}
							>
								{(item) => (
									<Select.Item id={item.id} textValue={item.name}>
										<Select.Label>{item.name}</Select.Label>
									</Select.Item>
								)}
							</Select.Content>
						</Select>

						{/* Font Weight */}
						<Select
							label="Font Weight"
							selectedKey={selectedText.fontWeight}
							onSelectionChange={(key) => {
								updateText(selectedTextId, (t) => ({
									...t,
									fontWeight: String(key) as typeof selectedText.fontWeight,
								}));
							}}
						>
							<Select.Trigger />
							<Select.Content items={FONT_WEIGHTS}>
								{(item) => (
									<Select.Item id={item.value} textValue={item.label}>
										<Select.Label>{item.label}</Select.Label>
									</Select.Item>
								)}
							</Select.Content>
						</Select>

						{/* Font Size */}
						<NumberField
							label="Font Size"
							value={selectedText.fontSize}
							onChange={(value) => {
								updateText(selectedTextId, (t) => ({
									...t,
									fontSize: Math.max(8, Math.min(500, value)),
								}));
							}}
							minValue={8}
							maxValue={500}
						/>

						{/* Text Align */}
						<Select
							label="Text Align"
							selectedKey={selectedText.textAlign}
							onSelectionChange={(key) => {
								updateText(selectedTextId, (t) => ({
									...t,
									textAlign: String(key) as typeof selectedText.textAlign,
								}));
							}}
						>
							<Select.Trigger />
							<Select.Content items={TEXT_ALIGNS}>
								{(item) => (
									<Select.Item id={item.value} textValue={item.label}>
										<Select.Label>{item.label}</Select.Label>
									</Select.Item>
								)}
							</Select.Content>
						</Select>

						{/* Color */}
						<TextField
							label="Color"
							value={selectedText.color}
							onChange={(value) => {
								updateText(selectedTextId, (t) => ({ ...t, color: value }));
							}}
						/>

						{/* Opacity */}
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium">
								Opacity: {Math.round(selectedText.opacity * 100)}%
							</label>
							<Slider
								value={[selectedText.opacity]}
								onChange={(value) => {
									updateText(selectedTextId, (t) => ({
										...t,
										opacity: value[0],
									}));
								}}
								minValue={0}
								maxValue={1}
								step={0.01}
							/>
						</div>

						{/* Remove button */}
						<Button
							variant="danger"
							onPress={() => {
								removeText(selectedTextId);
							}}
						>
							Remove Text
						</Button>
					</div>
				</DisclosurePanel>
			</Disclosure>
		</div>
	);
};

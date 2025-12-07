"use client";

import {
	Disclosure,
	DisclosurePanel,
	DisclosureTrigger,
} from "@/components/mesh/sidebar/mesh-sidebar-disclosure";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { Switch } from "@/components/ui/switch";
import { TextField } from "@/components/ui/text-field";
import { useMeshStore } from "@/store/store-mesh";
import { IconSparklesTwo } from "@intentui/icons";

export const MeshSidebarTextStyle = () => {
	const texts = useMeshStore((s) => s.texts);
	const selectedTextId = useMeshStore((s) => s.selectedTextId);
	const updateText = useMeshStore((s) => s.updateText);

	const selectedText = texts.find((t) => t.id === selectedTextId);

	if (!selectedText) {
		return null;
	}

	const hasStroke = !!selectedText.stroke;
	const hasShadow = !!selectedText.shadow;

	return (
		<div>
			<Disclosure>
				<DisclosureTrigger>
					<IconSparklesTwo /> Text Effects
				</DisclosureTrigger>
				<DisclosurePanel>
					<div className="flex flex-col gap-4">
						{/* Stroke */}
						<div className="flex flex-col gap-2">
							<Switch
								isSelected={hasStroke}
								onChange={(enabled) => {
									if (enabled) {
										updateText(selectedTextId, (t) => ({
											...t,
											stroke: {
												color: "#000000",
												width: 2,
											},
										}));
									} else {
										updateText(selectedTextId, (t) => ({
											...t,
											stroke: undefined,
										}));
									}
								}}
							>
								Enable Stroke
							</Switch>

							{hasStroke && selectedText.stroke && (
								<div className="flex flex-col gap-2 pl-4">
									<TextField
										label="Stroke Color"
										value={selectedText.stroke.color}
										onChange={(value) => {
											updateText(selectedTextId, (t) => ({
												...t,
												stroke: t.stroke
													? { ...t.stroke, color: value }
													: undefined,
											}));
										}}
									/>
									<NumberField
										label="Stroke Width"
										value={selectedText.stroke.width}
										onChange={(value) => {
											updateText(selectedTextId, (t) => ({
												...t,
												stroke: t.stroke
													? { ...t.stroke, width: Math.max(0, Math.min(20, value)) }
													: undefined,
											}));
										}}
										minValue={0}
										maxValue={20}
									/>
								</div>
							)}
						</div>

						{/* Shadow */}
						<div className="flex flex-col gap-2">
							<Switch
								isSelected={hasShadow}
								onChange={(enabled) => {
									if (enabled) {
										updateText(selectedTextId, (t) => ({
											...t,
											shadow: {
												offsetX: 2,
												offsetY: 2,
												blur: 4,
												color: "#00000080",
											},
										}));
									} else {
										updateText(selectedTextId, (t) => ({
											...t,
											shadow: undefined,
										}));
									}
								}}
							>
								Enable Shadow
							</Switch>

							{hasShadow && selectedText.shadow && (
								<div className="flex flex-col gap-2 pl-4">
									<TextField
										label="Shadow Color"
										value={selectedText.shadow.color}
										onChange={(value) => {
											updateText(selectedTextId, (t) => ({
												...t,
												shadow: t.shadow
													? { ...t.shadow, color: value }
													: undefined,
											}));
										}}
									/>
									<NumberField
										label="Offset X"
										value={selectedText.shadow.offsetX}
										onChange={(value) => {
											updateText(selectedTextId, (t) => ({
												...t,
												shadow: t.shadow
													? { ...t.shadow, offsetX: value }
													: undefined,
											}));
										}}
										minValue={-100}
										maxValue={100}
									/>
									<NumberField
										label="Offset Y"
										value={selectedText.shadow.offsetY}
										onChange={(value) => {
											updateText(selectedTextId, (t) => ({
												...t,
												shadow: t.shadow
													? { ...t.shadow, offsetY: value }
													: undefined,
											}));
										}}
										minValue={-100}
										maxValue={100}
									/>
									<NumberField
										label="Blur"
										value={selectedText.shadow.blur}
										onChange={(value) => {
											updateText(selectedTextId, (t) => ({
												...t,
												shadow: t.shadow
													? {
															...t.shadow,
															blur: Math.max(0, Math.min(100, value)),
														}
													: undefined,
											}));
										}}
										minValue={0}
										maxValue={100}
									/>
								</div>
							)}
						</div>
					</div>
				</DisclosurePanel>
			</Disclosure>
		</div>
	);
};

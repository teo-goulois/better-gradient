import { beforeEach, describe, expect, it, vi } from "vitest";

const installLocalStorageStub = () => {
	const storage = new Map<string, string>();
	vi.stubGlobal("localStorage", {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => storage.set(key, value),
		removeItem: (key: string) => storage.delete(key),
	});
};

describe("useMeshStore", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.unstubAllGlobals();
		installLocalStorageStub();
	});

	it("updates the solid canvas background from the first palette color without changing background mode", async () => {
		const { useMeshStore } = await import("./store-mesh");

		const store = useMeshStore.getState();
		store.setCanvas({ backgroundMode: "transparent" }, { history: "skip" });
		store.setPalette(
			[
				{ id: "background", color: "#123456" },
				{ id: "shape", color: "#abcdef" },
			],
			{ history: "skip" },
		);

		const state = useMeshStore.getState();
		expect(state.canvas.background.color).toBe("#123456");
		expect(state.canvas.backgroundMode).toBe("transparent");
	});
});

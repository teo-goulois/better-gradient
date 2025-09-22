export const withRafThrottle = <T extends unknown[]>(
	handler?: (...args: T) => void,
) => {
	let rafId = 0;
	let queuedArgs: T | null = null;

	return (...args: T) => {
		if (!handler) return;
		queuedArgs = args;
		if (rafId) return;
		rafId = requestAnimationFrame(() => {
			rafId = 0;
			const callArgs = queuedArgs;
			queuedArgs = null;
			if (callArgs) handler(...callArgs);
		});
	};
};

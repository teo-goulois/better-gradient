export default process.env.BETTER_GRADIENT_RUNTIME === "worker"
	? { output: { dir: ".cloudflare/worker" } }
	: process.env.BETTER_GRADIENT_NODE_OUTPUT
		? { output: { dir: process.env.BETTER_GRADIENT_NODE_OUTPUT } }
		: {};

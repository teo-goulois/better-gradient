import quota from "./config.quota.json";

// 33% of the account's Workers Paid included usage, shared by this project.
export const PROJECT_QUOTA_SHARE = quota.share;
export const QUOTA_WINDOW_DAYS = quota.windowDays;
export const WORKER_CPU_MS_PER_REQUEST = quota.workerCpuMsPerRequest;
export const WORKER_CPU_BUDGET_MS = Math.floor(
	30_000_000 * PROJECT_QUOTA_SHARE,
);
export const WORKER_REQUEST_BUDGET = Math.floor(
	10_000_000 * PROJECT_QUOTA_SHARE,
);
// Reserving the platform CPU ceiling also covers failed admitted requests.
export const DYNAMIC_REQUEST_LIMIT = Math.min(
	WORKER_REQUEST_BUDGET,
	Math.floor(WORKER_CPU_BUDGET_MS / WORKER_CPU_MS_PER_REQUEST),
);
export const WORKER_INITIAL_REQUESTS = quota.initialWorkerRequests; // Covers pre-migration traffic on October 6.
export const BROWSER_BUDGET_MS = Math.floor(
	10 * 60 * 60 * 1000 * PROJECT_QUOTA_SHARE,
);
export const BROWSER_RESERVATION_MS = quota.browserReservationMs;
export const BROWSER_ACTION_TIMEOUT_MS = quota.browserActionTimeoutMs;
export const BROWSER_INITIAL_USAGE_MS = quota.initialBrowserMs; // Includes the October 6 migration probes.

export type ApiTier = "public" | "verified";

export const API_LIMITS = {
	public: {
		perMinute: 20,
		perDay: 200,
		maxSize: 2048,
		maxCount: 8,
	},
	verified: {
		perMinute: 60,
		perDay: 1000,
		maxSize: 6000,
		maxCount: 10,
	},
} as const satisfies Record<
	ApiTier,
	{
		perMinute: number;
		perDay: number;
		maxSize: number;
		maxCount: number;
	}
>;

import { z } from "zod";

export const requestApiKeyValidator = z.object({
	email: z.string().email().max(320),
});

export const verifyApiKeyValidator = z.object({
	token: z.string().min(32),
});

export type RequestApiKeyValidator = z.infer<typeof requestApiKeyValidator>;
export type VerifyApiKeyValidator = z.infer<typeof verifyApiKeyValidator>;

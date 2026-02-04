import z from "zod";

export const requestApiKeyValidator = z.object({
	email: z.string().email(),
});

export const confirmApiKeyValidator = z.object({
	token: z.string().min(10),
});

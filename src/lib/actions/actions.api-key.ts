import { createServerFn } from "@tanstack/react-start";
import {
	confirmApiKeyValidator,
	requestApiKeyValidator,
} from "../validators/validator.api-key";

export const requestApiKey = createServerFn({
	method: "POST",
	response: "data",
})
	.inputValidator((data: unknown) => requestApiKeyValidator.parse(data))
	.handler(async ({ data }) => {
		const { requestApiKeyData } = await import("@/lib/server/api-key-service");
		return requestApiKeyData(data);
	});

export const confirmApiKeyRequest = createServerFn({
	method: "POST",
	response: "data",
})
	.inputValidator((data: unknown) => confirmApiKeyValidator.parse(data))
	.handler(async ({ data }) => {
		const { confirmApiKeyRequestData } = await import(
			"@/lib/server/api-key-service"
		);
		return confirmApiKeyRequestData(data);
	});

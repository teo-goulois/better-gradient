import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPosts = createServerFn().handler(async () => {
	const { getPostsData } = await import("@/lib/server/marble-service");
	return getPostsData();
});

export const getTags = createServerFn().handler(async () => {
	const { getTagsData } = await import("@/lib/server/marble-service");
	return getTagsData();
});

export const getSinglePost = createServerFn()
	.inputValidator(z.string())
	.handler(async ({ data: slug }) => {
		const { getSinglePostData } = await import("@/lib/server/marble-service");
		return getSinglePostData(slug);
	});

export const getCategories = createServerFn().handler(async () => {
	const { getCategoriesData } = await import("@/lib/server/marble-service");
	return getCategoriesData();
});

export const getAuthors = createServerFn().handler(async () => {
	const { getAuthorsData } = await import("@/lib/server/marble-service");
	return getAuthorsData();
});

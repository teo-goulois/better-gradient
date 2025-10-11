import type {
	MarbleAuthorList,
	MarbleCategoryList,
	MarblePost,
	MarblePostList,
	MarbleTagList,
} from "@/types/type.marble";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const url = process.env.MARBLE_API_URL;
const key = process.env.MARBLE_WORKSPACE_KEY;

export const getPosts = createServerFn().handler(async () => {
	try {
		const raw = await fetch(`${url}/${key}/posts`);
		const data: MarblePostList = await raw.json();
		return data;
	} catch (error) {
		console.log(error);
	}
});

export const getTags = createServerFn().handler(async () => {
	try {
		const raw = await fetch(`${url}/${key}/tags`);
		const data: MarbleTagList = await raw.json();
		return data;
	} catch (error) {
		console.log(error);
	}
});

export const getSinglePost = createServerFn()
	.validator(z.string())
	.handler(async ({ data: slug }) => {
		try {
			const raw = await fetch(`${url}/${key}/posts/${slug}`);
			const data: MarblePost = await raw.json();
			return data;
		} catch (error) {
			console.log(error);
		}
	});

export const getCategories = createServerFn().handler(async () => {
	try {
		const raw = await fetch(`${url}/${key}/categories`);
		const data: MarbleCategoryList = await raw.json();
		return data;
	} catch (error) {
		console.log(error);
	}
});

export const getAuthors = createServerFn().handler(async () => {
	try {
		const raw = await fetch(`${url}/${key}/authors`);
		const data: MarbleAuthorList = await raw.json();
		return data;
	} catch (error) {
		console.log(error);
	}
});

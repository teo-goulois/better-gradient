import { envServer } from "@/env-server";
import type {
	MarbleAuthorList,
	MarbleCategoryList,
	MarblePost,
	MarblePostList,
	MarbleTagList,
} from "@/types/type.marble";

const url = envServer.MARBLE_API_URL;
const key = envServer.MARBLE_WORKSPACE_KEY;

export async function getPostsData(): Promise<MarblePostList | undefined> {
	try {
		const raw = await fetch(`${url}/${key}/posts`);
		const data: MarblePostList = await raw.json();
		return data;
	} catch (error) {
		console.log(error);
	}
}

export async function getTagsData(): Promise<MarbleTagList | undefined> {
	try {
		const raw = await fetch(`${url}/${key}/tags`);
		const data: MarbleTagList = await raw.json();
		return data;
	} catch (error) {
		console.log(error);
	}
}

export async function getSinglePostData(
	slug: string,
): Promise<MarblePost | undefined> {
	try {
		const raw = await fetch(`${url}/${key}/posts/${slug}`);
		const data: MarblePost = await raw.json();
		return data;
	} catch (error) {
		console.log(error);
	}
}

export async function getCategoriesData(): Promise<
	MarbleCategoryList | undefined
> {
	try {
		const raw = await fetch(`${url}/${key}/categories`);
		const data: MarbleCategoryList = await raw.json();
		return data;
	} catch (error) {
		console.log(error);
	}
}

export async function getAuthorsData(): Promise<MarbleAuthorList | undefined> {
	try {
		const raw = await fetch(`${url}/${key}/authors`);
		const data: MarbleAuthorList = await raw.json();
		return data;
	} catch (error) {
		console.log(error);
	}
}

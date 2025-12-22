import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";

// // Retrieve posts and sort them by publication date
export function extractCategoryFromId(id: string): string | null {
	const parts = id.split("/");
	if (parts.length <= 1) return null; // Root level post

	// Bundle check: path/to/post/index.md
	if (parts[parts.length - 1].startsWith("index.")) {
		if (parts.length <= 2) return null; // post/index.md -> no category
		return parts.slice(0, -2).join("/"); // path/to
	}

	// Single file: path/to/post.md
	return parts.slice(0, -1).join("/"); // path/to
}

async function getPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	allBlogPosts.forEach((post) => {
		const categoryFromPath = extractCategoryFromId(post.id);
		if (categoryFromPath) {
			post.data.category = categoryFromPath;
		} else {
			post.data.category = null;
		}
	});

	return allBlogPosts;
}

async function getRawSortedPosts() {
	const allBlogPosts = await getPosts();

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getPosts();

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getPosts();
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = (count[ucKey] || 0) + 1;
			return;
		}

		// 분할된 경로 전체에 대해 카운트 주입 (예: "dev/study" -> "dev", "dev/study" 둘 다 카운트)
		const parts = post.data.category.split("/");
		for (let i = 1; i <= parts.length; i++) {
			const parentCategory = parts.slice(0, i).join("/");
			count[parentCategory] = (count[parentCategory] || 0) + 1;
		}
	});

	// 카테고리별 정렬 가중치 설정
	const SORT_WEIGHT: { [key: string]: number } = {
		// 1차 카테고리
		"dev": 100,
		"philosophy": 200,
		"life": 300,
		"guide": 400,
		// 2차 카테고리 (dev)
		"dev/study": 110,
		"dev/projects": 120,
		"dev/retrospect": 130,
		// 2차 카테고리 (philosophy)
		"philosophy/inspirations": 210,
		"philosophy/thoughts": 220,
		// 2차 카테고리 (life)
		"life/body": 310,
		"life/places": 320,
		"life/gardening": 330,
	};

	const lst = Object.keys(count).sort((a, b) => {
		const weightA = SORT_WEIGHT[a] || 999;
		const weightB = SORT_WEIGHT[b] || 999;

		if (weightA !== weightB) {
			return weightA - weightB;
		}

		// 가중치가 같거나 없는 경우 기존 로직(깊이 -> 이름) 유지
		const depthA = a.split("/").length;
		const depthB = b.split("/").length;
		if (depthA !== depthB) return depthA - depthB;
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}

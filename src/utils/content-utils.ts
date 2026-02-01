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

	const sorted = allBlogPosts
		.filter((post) => !post.id.startsWith("privacy/"))
		.sort((a, b) => {
			const dateA = new Date(a.data.published);
			const dateB = new Date(b.data.published);
			return dateA > dateB ? -1 : 1;
		});
	return sorted;
}

export async function getAllPosts() {
	return await getPosts();
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

export async function getSortedProjects() {
	const allProjects = await getCollection("projects", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const sorted = allProjects.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});

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
	const allPosts = await getPosts();
	const allBlogPosts = allPosts.filter((post) => !post.id.startsWith("privacy/"));

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
	const allPosts = await getPosts();
	const allBlogPosts = allPosts.filter((post) => !post.id.startsWith("privacy/"));
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
		dev: 100,
		philosophy: 200,
		life: 300,
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
		const partsA = a.split("/");
		const partsB = b.split("/");
		const rootA = partsA[0];
		const rootB = partsB[0];

		const weightA = SORT_WEIGHT[rootA] || 999;
		const weightB = SORT_WEIGHT[rootB] || 999;

		if (weightA !== weightB) {
			return weightA - weightB;
		}

		// 같은 루트 카테고리 내에서는 경로 문자열로 정렬하여 계층 구조 유지
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

/**
 * 텍스트 내의 따옴표와 『』 문자를 스타일링된 span 태그로 변환함.
 * @param text 대상 텍스트
 * @returns 스타일링된 HTML 문자열
 */
export function stylizeText(text: string): string {
	const regex = /["“]([^"“”]+?)["”]|['‘]([^'‘’]+?)['’]|[『]([^『』]+?)[』]/g;
	return text.replace(regex, (_, p1, p2, p3) => {
		let className = "";
		let content = "";
		if (p1 !== undefined) {
			className = "quote-double";
			content = p1;
		} else if (p2 !== undefined) {
			className = "quote-single";
			content = p2;
		} else {
			className = "quote-corner";
			content = p3;
		}
		return `<span class="${className} stylized-quote">${content}</span>`;
	});
}

import { getCollection } from "astro:content";
import { isPrivacyPostId } from "../utils/content-utils";

export async function GET() {
	const allPosts = await getCollection("posts");
	const posts = allPosts.filter((post) => !isPrivacyPostId(post.id));

	const searchData = posts.map((post) => {
		// 1. 명시적인 category가 있으면 사용
		let category = post.data.category;

		// 2. category가 없을 경우 폴더 구조를 분석하여 지능적으로 추출
		if (!category) {
			// 경로 구분자 정규화 (윈도우 대응)
			const normalizedId = post.id.replace(/\\/g, "/");
			const pathParts = normalizedId.split("/");

			// 마지막 요소가 파일명이므로 제거
			const fileName = pathParts.pop() || "";

			// 만약 index.md 형태라면, 그 위 폴더명도 포스트의 식별자이므로 하나 더 제거하여 상위 카테고리만 남김
			if (fileName.startsWith("index.") && pathParts.length > 0) {
				pathParts.pop();
			}

			category = pathParts.join("/");
		}

		// 3. 본문 텍스트 정제 (마크다운 기호 및 구조적 노이즈 제거)
		// '표', '차트' 등이 다른 단어의 일부일 경우(예: 목표)를 대비해 문맥적으로 제거
		const isDietLog =
			post.data.tags.includes("diet") || post.id.includes("diet-log");
		let cleanContent = post.body.replace(/[#`*]/g, "");

		if (isDietLog) {
			// 다이어트 일지에서만 반복되는 구조적 단어들을 제거 (텍스트 본연의 가치 보존)
			const noisePatterns = [
				/체중변화 추이/g,
				/\b표\b/g, // 독립된 단어로서의 '표'만 제거
				/\b차트\b/g, // 독립된 단어로서의 '차트'만 제거
				/\b대시보드\b/g, // 독립된 단어로서의 '대시보드'만 제거
			];
			for (const pattern of noisePatterns) {
				cleanContent = cleanContent.replace(pattern, "");
			}
		}

		cleanContent = cleanContent.replace(/\s+/g, " ").trim();

		return {
			title: post.data.title,
			description: post.data.description || "",
			category: category || "Uncategorized",
			tags: post.data.tags || [],
			url: `/posts/${post.id}/`,
			content: cleanContent.substring(0, 1500),
		};
	});

	return new Response(JSON.stringify(searchData), {
		headers: {
			"Content-Type": "application/json",
		},
	});
}

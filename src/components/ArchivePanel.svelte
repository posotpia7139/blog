<script lang="ts">
import { onMount } from "svelte";

import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";
import { getPostUrlBySlug } from "../utils/url-utils";

export let tags: string[] = [];
export let categories: string[] = [];
export let sortedPosts: Post[] = [];

interface Post {
	slug: string;
	data: {
		title: string;
		tags: string[];
		category?: string | null;
		published: Date;
	};
}

interface Group {
	year: number;
	posts: Post[];
}

let groups: Group[] = [];

function setGroups(posts: Post[]) {
	const grouped = posts.reduce(
		(acc, post) => {
			const year = post.data.published.getFullYear();
			if (!acc[year]) {
				acc[year] = [];
			}
			acc[year].push(post);
			return acc;
		},
		{} as Record<number, Post[]>,
	);

	const groupedPostsArray = Object.keys(grouped).map((yearStr) => ({
		year: Number.parseInt(yearStr, 10),
		posts: grouped[Number.parseInt(yearStr, 10)],
	}));

	groupedPostsArray.sort((a, b) => b.year - a.year);
	groups = groupedPostsArray;
}

// Initial render with all posts
setGroups(sortedPosts);

function formatDate(date: Date) {
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${month}-${day}`;
}

function formatTag(tagList: string[]) {
	return tagList.map((t) => `#${t}`).join(" ");
}

onMount(async () => {
	const params = new URLSearchParams(window.location.search);
	const tagParams = params.has("tag") ? params.getAll("tag") : [];
	const categoryParams = params.has("category") ? params.getAll("category") : [];
	const uncategorizedParam = params.get("uncategorized");

	if (tagParams.length > 0 || categoryParams.length > 0 || uncategorizedParam) {
		tags = tagParams;
		categories = categoryParams;
		let filteredPosts: Post[] = sortedPosts;

		if (tags.length > 0) {
			filteredPosts = filteredPosts.filter(
				(post) =>
					Array.isArray(post.data.tags) &&
					post.data.tags.some((tag) => tags.includes(tag)),
			);
		}

		if (categories.length > 0) {
			filteredPosts = filteredPosts.filter(
				(post) =>
					post.data.category &&
					categories.some(
						(c) =>
							post.data.category === c ||
							(post.data.category as string).startsWith(`${c}/`),
					),
			);
		}

		if (uncategorizedParam) {
			filteredPosts = filteredPosts.filter((post) => !post.data.category);
		}
		setGroups(filteredPosts);
	}
});
</script>

<div class="card-base px-8 py-6">
    <!-- 글로벌 필터 헤더: 선택된 카테고리나 태그 정보를 맨 위에 한 번만 표시 -->
    <div class="mb-6 pb-6 border-b border-black/5 dark:border-white/5">
        <div class="transition text-left text-50 flex items-center flex-wrap">
            {#if categories.length > 0}
                {@const parts = categories[0].split('/')}
                {@const leaf = parts.pop()}
                {@const totalCount = groups.reduce((acc, g) => acc + g.posts.length, 0)}
                
                <!-- 모바일 전용 계층형 리스트 뷰 (3차만 15px 들여쓰기) -->
                <div class="flex flex-col w-full md:hidden space-y-0.5 pl-5 pt-5">
                    {#each parts as part, i}
                        <div class="flex items-center h-6" style="padding-left: {i === 2 ? 15 : 0}px">
                            {#if i > 0}
                                <span class="text-[0.7rem] opacity-30 mr-1.5">└</span>
                            {/if}
                            <span class:list={["text-sm", {"font-medium": i === 0, "text-75": i > 0}]}>{part}</span>
                        </div>
                    {/each}
                    <div class="flex items-center h-6" style="padding-left: {parts.length === 2 ? 15 : 0}px">
                        {#if parts.length > 0}
                            <span class="text-[0.7rem] opacity-30 mr-1.5">└</span>
                        {/if}
                        <span class="text-[var(--primary)] font-bold text-base">{leaf}</span>
                        <span class="ml-2 flex items-center shrink-0">
                            <span class="text-base font-semibold opacity-60">전체 게시물&nbsp;</span>
                            <span class="text-[var(--primary)] font-bold text-base">{totalCount}</span>
                            <span class="text-base font-semibold opacity-60">개</span>
                        </span>
                    </div>
                </div>

                <!-- 데스크탑 전용 가로형 브레드크럼 -->
                <div class="hidden md:flex md:flex-row md:items-center w-full flex-wrap">
                    {#each parts as part}
                        <span class="text-base">{part}</span>
                        <span class="mx-1.5 text-black/30 dark:text-white/30 font-normal">/</span>
                    {/each}
                    <span class="text-[var(--primary)] font-bold text-base">{leaf}</span>
                    <div class="ml-2 flex items-center shrink-0">
                        <span class="text-xs opacity-60">전체 게시물&nbsp;</span>
                        <span class="text-[var(--primary)] font-bold text-xs">{totalCount}</span>
                        <span class="text-xs opacity-60">개</span>
                    </div>
                </div>
            {:else if tags.length > 0}
                <div class="flex items-center">
                    <span class="text-[var(--primary)] text-xl mr-2">#</span>
                    <span class="text-[var(--primary)] font-bold text-xl">{tags[0]}</span>
                    <span class="ml-3 text-75">{groups.reduce((acc, g) => acc + g.posts.length, 0)} {i18n(I18nKey.postsCount)}</span>
                </div>
            {:else}
                <div class="flex items-center text-xl font-bold text-75">
                    {groups.reduce((acc, g) => acc + g.posts.length, 0)} {i18n(I18nKey.postsCount)}
                </div>
            {/if}
        </div>
    </div>

    {#each groups as group}
        <div class="mb-8 last:mb-0">
            <div class="flex flex-row w-full items-center h-[3.75rem]">
                <div class="w-[15%] md:w-[10%] transition text-2xl font-semibold text-right text-75">
                    {group.year}
                </div>
                <div class="w-[15%] md:w-[10%]">
                    <div
                            class="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto
                  -outline-offset-[2px] z-50 outline-3"
                    ></div>
                </div>
                <div class="w-[70%] md:w-[80%] transition text-left text-50 text-sm flex items-center">
                    <span class="text-[var(--primary)] font-bold mr-1">{group.posts.length}</span>
                    <span class="opacity-60">{i18n(group.posts.length === 1 ? I18nKey.postCount : I18nKey.postsCount)}</span>
                </div>
            </div>

            <div class="mt-2 space-y-1">
                {#each group.posts as post}
                    <a
                            href={getPostUrlBySlug(post.slug)}
                            aria-label={post.data.title}
                            class="group btn-plain !block h-10 w-full rounded-lg hover:text-[initial]"
                    >
                        <div class="flex flex-row justify-start items-center h-full">
                            <!-- date -->
                            <div class="w-[15%] md:w-[10%] transition text-sm text-right text-50">
                                {formatDate(post.data.published)}
                            </div>

                            <!-- dot and line -->
                            <div class="w-[15%] md:w-[10%] relative dash-line h-full flex items-center">
                                <div
                                        class="transition-all mx-auto w-1 h-1 rounded group-hover:h-5
                           bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)]
                           outline outline-4 z-50
                           outline-[var(--card-bg)]
                           group-hover:outline-[var(--btn-plain-bg-hover)]
                           group-active:outline-[var(--btn-plain-bg-active)]"
                                ></div>
                            </div>

                            <!-- post title -->
                            <div
                                    class="w-[70%] md:max-w-[65%] md:w-[65%] text-left font-medium
                         group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)]
                         text-75 pr-8 whitespace-nowrap overflow-ellipsis overflow-hidden"
                            >
                                {post.data.title}
                            </div>

                            <!-- tag list -->
                            <div
                                    class="hidden md:block md:w-[15%] text-left text-sm transition
                         whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
                            >
                                {formatTag(post.data.tags)}
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/each}
</div>

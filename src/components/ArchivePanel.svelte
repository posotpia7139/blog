<script lang="ts">
import { onMount } from "svelte";
import { tweened } from "svelte/motion";
import { expoOut } from "svelte/easing";

import { siteConfig } from "../config";
import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";
import { getPostUrlBySlug } from "../utils/url-utils";

export let tags: string[] = [];
export let categories: string[] = [];
export let sortedPosts: Post[] = [];

// [애니메이션] 숫자가 차오르는 효과를 위한 tweened 변수
const animatedCount = tweened(0, {
	duration: 2400,
	easing: expoOut,
});

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
let totalCount = 0;

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

	totalCount = posts.length;
	
	// 모든 텍스트와 연도 애니메이션이 끝난 후(약 1.5초 뒤) 카운트업 시작
	const isInitialLoad = $animatedCount === 0;
	setTimeout(() => {
		animatedCount.set(totalCount);
	}, isInitialLoad ? 1500 : 0);
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
	const categoryParams = params.has("category")
		? params.getAll("category")
		: [];
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
    <div class="">
        <div class="transition text-left text-50 flex items-center flex-wrap">
            {#if categories.length > 0}
                {@const allParts = categories[0].split('/')}
                {@const totalCount = groups.reduce((acc, g) => acc + g.posts.length, 0)}
                <div class="flex flex-col items-start w-full py-4 pl-2">
                    <div class="flex flex-row items-center flex-wrap justify-start">
                        {#each allParts as part, i}
                            {@const isLast = i === allParts.length - 1}
                            <span class="{isLast ? 'text-[var(--primary)] font-bold text-[13px]' : 'text-[13px]'}">{part}</span>
                            {#if !isLast}
                                <span class="mx-1.5 text-black/30 dark:text-white/30 font-normal">/</span>
                            {/if}
                        {/each}
                    </div>
                    <div class="mt-1 flex items-center shrink-0">
                        <span class="text-[13px] opacity-60">게시물&nbsp;</span>
                        <span class="text-[var(--primary)] font-bold text-[13px]">{totalCount}</span>
                        <span class="text-[13px] opacity-60">개</span>
                    </div>
                </div>
            {:else if tags.length > 0}
                <div class="flex items-center">
                    <span class="text-[var(--primary)] text-xl mr-2">#</span>
                    <span class="text-[var(--primary)] font-bold text-xl">{tags[0]}</span>
                    <span class="ml-3 text-75">{groups.reduce((acc, g) => acc + g.posts.length, 0)} {i18n(I18nKey.postsCount)}</span>
                </div>
            {:else}
                {@const newestYear = sortedPosts.length > 0 ? sortedPosts[0].data.published.getFullYear() : new Date().getFullYear()}
                {@const oldestYear = sortedPosts.length > 0 ? sortedPosts[sortedPosts.length - 1].data.published.getFullYear() : newestYear}
                
                <div class="flex flex-col items-center w-full py-12 mb-6 border-b border-dashed border-[var(--line-divider)] overflow-hidden">
                    <div class="relative">
                        <span class="inline-block text-[18px] text-[var(--primary)] font-bold tracking-tight leading-none anim-fade-in delay-200">
                            {siteConfig.title}
                        </span>
                        <span class="absolute left-full top-[-4px] ml-1 text-[8px] text-[var(--primary)] font-black uppercase tracking-[0.12em] leading-none whitespace-nowrap anim-fade-in delay-400">
                            Archive
                        </span>
                    </div>
                    
                    <div class="mt-5 flex flex-col items-center gap-3">
                        <!-- 2단: 연도 연대기 애니메이션 -->
                        <div class="flex items-center text-[13px] font-semibold text-black/70 dark:text-white/70 h-5">
                            <span class="text-[var(--primary)] font-bold anim-fade-in delay-600">{oldestYear}</span>
                            <div class="year-connector anim-grow-line"></div>
                            <span class="text-[var(--primary)] font-bold anim-fade-in delay-1100">{newestYear}</span>
                        </div>
                        
                        <!-- 3단: 게시물 개수 (정밀 2px 간격 최적화) -->
                        <div class="text-[12px] font-medium text-center text-black/60 dark:text-white/60 anim-fade-in delay-1300">
                            <span class="surround-text left-text" class:show-surround={$animatedCount >= totalCount - 0.1}>
                                기록된
                            </span>
                            
                            <span class="inline-block text-right text-[var(--primary)] font-bold text-[14px] transition-all duration-700 mr-[2px]" 
                                  class:count-finished={$animatedCount >= totalCount - 0.1}
                                  style="width: {totalCount.toString().length}ch; font-variant-numeric: tabular-nums;">{Math.round($animatedCount)}</span><span class="surround-text right-text" class:show-surround={$animatedCount >= totalCount - 0.1}>개의 불꽃들</span>
                        </div>
                    </div>
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
                    <div class="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto -outline-offset-[2px] z-50 outline-3"></div>
                </div>
                <div class="w-[70%] md:w-[80%] transition text-left text-50 text-base md:text-base flex items-center">
                    <span class="text-[var(--primary)] font-bold mr-1">{group.posts.length}</span>
                    <span class="opacity-60">{i18n(group.posts.length === 1 ? I18nKey.postCount : I18nKey.postsCount)}</span>
                </div>
            </div>

            <div class="mt-2 space-y-1">
                {#each group.posts as post}
                    <a href={getPostUrlBySlug(post.slug)} aria-label={post.data.title} class="group btn-plain !block h-10 w-full rounded-lg hover:text-[initial]">
                        <div class="flex flex-row justify-start items-center h-full">
                            <div class="w-[15%] md:w-[10%] transition text-sm text-right text-50">
                                {formatDate(post.data.published)}
                            </div>
                            <div class="w-[15%] md:w-[10%] relative dash-line h-full flex items-center">
                                <div class="transition-all mx-auto w-1 h-1 rounded group-hover:h-5 bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)] outline outline-4 z-50 outline-[var(--card-bg)] group-hover:outline-[var(--btn-plain-bg-hover)] group-active:outline-[var(--btn-plain-bg-active)]"></div>
                            </div>
                            <div class="w-[70%] md:max-w-[65%] md:w-[65%] text-left font-medium group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)] text-75 pr-8 whitespace-nowrap overflow-ellipsis overflow-hidden">
                                {post.data.title}
                            </div>
                            <div class="hidden md:block md:w-[15%] text-left text-sm transition whitespace-nowrap overflow-ellipsis overflow-hidden text-30">
                                {formatTag(post.data.tags)}
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/each}
</div>

<style>
    @keyframes slide-up-fade {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .anim-fade-in {
        opacity: 0;
        animation: slide-up-fade 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .delay-200 { animation-delay: 200ms; }
    .delay-400 { animation-delay: 400ms; }
    .delay-600 { animation-delay: 600ms; }
    .delay-1100 { animation-delay: 1100ms; }
    .delay-1300 { animation-delay: 1300ms; }

    /* [베지어 곡선] 주변 텍스트: 강렬한 Burst-Out 연출 */
    .surround-text {
        opacity: 0;
        filter: blur(8px);
        transition: all 1.1s cubic-bezier(0.16, 1, 0.3, 1);
        white-space: nowrap;
        display: inline-block;
    }

    .left-text {
        transform: translateX(60px) scale(0.2);
    }
    
    .right-text {
        transform: translateX(-60px) scale(0.2);
    }

    .show-surround {
        opacity: 1;
        filter: blur(0);
        transform: translateX(0) scale(1);
    }

    /* 카운팅 완료 시 번쩍이는 불꽃 효과 */

    .count-finished {
        text-shadow: 0 0 20px oklch(0.7 0.2 250 / 0.5);
        transform: scale(1.1);
        color: var(--primary) !important;
    }

    .year-connector {
        width: 0;
        height: 1px;
        background: var(--primary);
        opacity: 0.3;
        margin: 0 12px;
    }

    @keyframes grow-line {
        from { width: 0; }
        to { width: 24px; }
    }

    .anim-grow-line {
        animation: grow-line 0.6s cubic-bezier(0.76, 0, 0.24, 1) forwards;
        animation-delay: 800ms;
    }
</style>
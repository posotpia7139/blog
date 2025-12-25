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

// [애니메이션] 숫자가 차오르는 효과를 위한 tweened 변수 (더 강한 감속 효과 적용)
const animatedCount = tweened(0, {
	duration: 3000, // 더 드라마틱한 연출을 위해 시간을 조금 늘림
	easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t), // expoOut과 유사하지만 더 날카로운 커스텀 감속
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
	
	// 모든 텍스트와 연도 애니메이션이 끝난 후(약 4.1초 뒤) 카운트업 시작
	const isInitialLoad = $animatedCount === 0;
	setTimeout(() => {
		animatedCount.set(totalCount);
	}, isInitialLoad ? 4100 : 0);
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
                            <span class="{isLast ? 'text-[var(--primary)] font-bold text-[13px]' : 'text-[13px]'} capitalize">{part}</span>
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
                {@const totalCount = groups.reduce((acc, g) => acc + g.posts.length, 0)}
                <div class="flex flex-col items-start w-full py-4 pl-2">
                    <div class="flex flex-row items-center flex-wrap justify-start">
                        <span class="text-[var(--primary)] text-[13px] mr-1">#</span>
                        <span class="text-[var(--primary)] font-bold text-[13px]">{tags[0]}</span>
                    </div>
                    <div class="mt-1 flex items-center shrink-0">
                        <span class="text-[13px] opacity-60">게시물&nbsp;</span>
                        <span class="text-[var(--primary)] font-bold text-[13px]">{totalCount}</span>
                        <span class="text-[13px] opacity-60">개</span>
                    </div>
                </div>
            {:else}
                {@const newestYear = sortedPosts.length > 0 ? sortedPosts[0].data.published.getFullYear() : new Date().getFullYear()}
                {@const oldestYear = sortedPosts.length > 0 ? sortedPosts[sortedPosts.length - 1].data.published.getFullYear() : newestYear}
                
                <div class="flex flex-col items-center w-full py-8 mt-2 mb-6 overflow-hidden gap-4">
                    <!-- 1단: 제목 (ARCHIVE 및 타이틀 모두 한 글자씩 등장) -->
                    <div class="flex flex-col items-center">
                        <div class="flex flex-row mb-2">
                            {#each "ARCHIVE".split("") as char, i}
                                <span class="text-[10px] text-black/50 dark:text-white/50 font-black uppercase tracking-[0.2em] leading-none anim-char-in"
                                      style="animation-delay: {i * 100}ms">
                                    {char}
                                </span>
                            {/each}
                        </div>
                        <div class="flex flex-row flex-wrap justify-center">
                            {#each siteConfig.title.split("") as char, i}
                                <span class="inline-block text-[22px] text-black dark:text-white font-bold tracking-tight leading-none anim-char-in"
                                      style="animation-delay: {800 + (i * 100)}ms">
                                    {char === " " ? "\u00A0" : char}
                                </span>
                            {/each}
                        </div>
                    </div>
                    
                    <!-- 2단: 연도 연대기 애니메이션 (균형 잡힌 순차 등장) -->
                    <div class="flex items-center text-[16px] font-bold text-black/70 dark:text-white/70 h-6 mb-2">
                        <span class="anim-fade-in delay-2500">{oldestYear}</span>
                        <div class="year-connector anim-grow-line delay-2900"></div>
                        <span class="anim-fade-in delay-3300">{newestYear}</span>
                    </div>
                    
                    <!-- 3단: 게시물 개수 (균형 잡힌 리듬으로 등장) -->
                    <div class="flex flex-col items-center justify-center anim-fade-in delay-4100 -mt-0.5">
                        <span class="inline-block font-medium text-[56px] leading-[0.9] transition-all duration-700 tabular-nums tracking-[-0.05em] text-[var(--primary)]" 
                                class:count-finished={$animatedCount >= totalCount - 0.1}>
                            {Math.round($animatedCount)}
                        </span>
                        <span class="mt-2 text-[14px] font-bold text-black/40 dark:text-white/40 uppercase">
                            게시물
                        </span>
                    </div>
                </div>            {/if}
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
    /* 깔끔한 상승 페이드인 (흔들림 없음) */
    @keyframes slide-up-fade {
        0% { opacity: 0; transform: translateY(12px); }
        100% { opacity: 1; transform: translateY(0); }
    }

    .anim-fade-in {
        opacity: 0;
        animation: slide-up-fade 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    /* 글자 개별 등장 효과 복구 */
    @keyframes char-in {
        0% { opacity: 0; transform: translateY(8px); filter: blur(4px); }
        100% { opacity: 1; transform: translateY(0); filter: blur(0); }
    }

    .anim-char-in {
        display: inline-block;
        opacity: 0;
        animation: char-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    /* 가로선 효과 */
    .year-connector {
        width: 0;
        height: 1.25px;
        background: #888;
        opacity: 0;
        margin: 0 12px;
        display: inline-block;
        visibility: hidden;
    }

    @keyframes grow-line {
        0% { 
            width: 0; 
            opacity: 0; 
            visibility: visible;
            transform: translateX(-4px); 
        }
        100% { 
            width: 32px; 
            opacity: 0.6; 
            visibility: visible;
            transform: translateX(0); 
        }
    }

    .anim-grow-line {
        animation: grow-line 1.2s cubic-bezier(0.33, 1, 0.68, 1) both;
    }

    /* 카운팅 완료 시 1회 팝업 (스케일만 살짝) */
    .count-finished {
        animation: initial-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        will-change: transform;
    }

    @keyframes initial-pop {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    /* 카운팅 중 테마 파란색 유지 */
    .counting-blue {
        color: var(--primary) !important;
        transition: color 0.3s ease;
    }

    /* 딜레이 클래스: 단축 속성(animation)의 초기화를 방지하기 위해 최하단에 배치 */
    .delay-2500 { animation-delay: 2500ms; }
    .delay-2900 { animation-delay: 2900ms; }
    .delay-3300 { animation-delay: 3300ms; }
    .delay-4100 { animation-delay: 4100ms; }
</style>
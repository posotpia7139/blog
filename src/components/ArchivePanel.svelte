<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount, untrack } from "svelte";
import { siteConfig } from "../config";
import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";
import { getPostUrlBySlug } from "../utils/url-utils";

interface Post {
	slug: string;
	data: {
		title: string;
		tags: string[];
		category?: string | null;
		published: Date | string;
	};
}

interface Group {
	year: number;
	posts: Post[];
}

let { tags = [], categories = [], sortedPosts = [] } = $props();

let mounted = $state(false);
let displayCount = $state(0);
let isPopping = $state(false);
let filterTags = $state(untrack(() => tags));
let filterCategories = $state(untrack(() => categories));

const toDate = (d: Date | string) => {
	const date = d instanceof Date ? d : new Date(d);
	return Number.isNaN(date.getTime()) ? new Date() : date;
};

const filteredPosts = $derived.by(() => {
	let posts = sortedPosts;
	if (filterTags.length > 0) {
		posts = posts.filter(
			(p) =>
				Array.isArray(p.data.tags) &&
				p.data.tags.some((t: string) => filterTags.includes(t)),
		);
	}
	if (filterCategories.length > 0) {
		posts = posts.filter(
			(p) =>
				p.data.category &&
				filterCategories.some(
					(c: string) =>
						p.data.category === c || p.data.category.startsWith(`${c}/`),
				),
		);
	}
	return posts;
});

const groups = $derived.by(() => {
	const grouped = filteredPosts.reduce(
		(acc, post) => {
			const date = toDate(post.data.published);
			const year = date.getFullYear();
			if (!acc[year]) acc[year] = [];
			acc[year].push(post);
			return acc;
		},
		{} as Record<number, Post[]>,
	);

	return Object.keys(grouped)
		.map((year) => ({
			year: Number.parseInt(year, 10),
			posts: grouped[Number.parseInt(year, 10)],
		}))
		.sort((a, b) => b.year - a.year);
});

const targetCount = $derived(filteredPosts.length);

const newestDate = $derived(
	sortedPosts.length > 0 ? toDate(sortedPosts[0].data.published) : new Date(),
);
const oldestDate = $derived(
	sortedPosts.length > 0
		? toDate(sortedPosts[sortedPosts.length - 1].data.published)
		: newestDate,
);

const categorySegments = $derived(
	filterCategories.length > 0 ? filterCategories[0].split("/") : [],
);

// [타임라인] 숫자 노출 시작 지연 시간
const START_DELAY = 1550;

$effect(() => {
	// Svelte 5: mounted만 추적하여 로직이 한 번만 실행되도록 함
	if (mounted && targetCount > 0) {
		untrack(() => {
			displayCount = 0;
			isPopping = false;

			const startTimeout = setTimeout(() => {
				const duration = 5000; // 카운팅 지속시간 (5초)
				const frameRate = 1000 / 60;
				const totalFrames = duration / frameRate;
				let currentFrame = 0;

				const timer = setInterval(() => {
					currentFrame++;
					const progress = currentFrame / totalFrames;

					// 후반부가 초반부보다 훨씬 느려지는 비대칭 Ease-In-Out 공식
					const p = 3;
					const q = 7;
					const ease = progress ** p / (progress ** p + (1 - progress) ** q);

					displayCount = targetCount * ease;

					// [핵심] 실제 게시물 숫자에 도달하는 순간 즉시 팝!
					if (Math.round(displayCount) >= targetCount && !isPopping) {
						displayCount = targetCount;
						isPopping = true;
					}

					if (currentFrame >= totalFrames) {
						clearInterval(timer);
					}
				}, frameRate);
			}, START_DELAY);
		});
	}
});

onMount(() => {
	mounted = true;
	const params = new URLSearchParams(window.location.search);
	const tagParams = params.has("tag") ? params.getAll("tag") : [];
	const categoryParams = params.has("category")
		? params.getAll("category")
		: [];
	if (tagParams.length > 0) filterTags = tagParams;
	if (categoryParams.length > 0) filterCategories = categoryParams;
});

function formatDate(date: Date | string) {
	const d = toDate(date);
	return `${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function formatTag(tagList: string[]) {
	return tagList.map((t) => `#${t}`).join(" ");
}
</script>

<div class="card-base px-4 md:px-8 pt-6 pb-[42px] onload-animation min-h-[300px] overflow-hidden w-full box-border">
    <div class="transition text-left text-50 flex items-center flex-wrap w-full">
        {#if filterCategories.length > 0 || filterTags.length > 0}
            <div class="flex flex-col items-start justify-start w-full py-6 md:py-12 gap-2">
                <div class="flex flex-row items-center flex-wrap justify-start px-4">
                    {#if filterCategories.length > 0}
                        <Icon icon="material-symbols:folder-open-outline-rounded" class="text-[var(--primary)] text-[15px] md:text-[20px] mr-2 md:mr-3" />
                        {#each categorySegments as segment, i}
                            {#if i > 0}
                                <span class="mx-2 opacity-30 text-[13px] md:text-[17px] translate-y-[0.5px] md:translate-y-[1px]">/</span>
                            {/if}
                            <span class="text-[13px] md:text-[17px] translate-y-[0.5px] md:translate-y-[1px] capitalize {i === categorySegments.length - 1 ? 'text-[var(--primary)] font-bold' : 'text-black/75 dark:text-white/75'}">
                                {segment}
                            </span>
                        {/each}
                    {:else if filterTags.length > 0}
                        <Icon icon="material-symbols:tag-rounded" class="text-[var(--primary)] text-[15px] md:text-[20px] mr-2 md:mr-3" />
                        <span class="text-[var(--primary)] font-bold text-[13px] md:text-[17px] translate-y-[0.5px] md:translate-y-[1px] capitalize">
                            {filterTags[0]}
                        </span>
                    {/if}
                </div>
                <div class="flex items-center justify-start shrink-0 px-4">
                    <span class="text-[13px] md:text-[17px] opacity-60">게시물&nbsp;</span>
                    <span class="text-[var(--primary)] font-bold text-[13px] md:text-[17px]">{targetCount}</span>
                    <span class="text-[13px] md:text-[17px] opacity-60">개</span>
                </div>
                <div class="w-16 md:w-24 h-1 md:h-1.5 rounded-full bg-[var(--primary)]/10 mt-2 ml-4"></div>
            </div>
        {:else}
            <div class="flex flex-col items-center w-full py-8 mt-2 mb-6 overflow-hidden gap-4">
                <div class="flex flex-col items-center">
                    <div class="flex flex-row mb-2">
                        {#each "ARCHIVE".split("") as char, i}
                            <span class="text-[10px] text-black/50 dark:text-white/50 font-black uppercase tracking-[0.2em] leading-none anim-char-in"
                                  style="animation-delay: {300 + (i * 40)}ms">
                                {char}
                            </span>
                        {/each}
                    </div>
                    <div class="flex flex-row flex-wrap justify-center">
                        {#each siteConfig.title.split("") as char, i}
                            <span class="inline-block text-[22px] text-black dark:text-white font-bold tracking-tight leading-none anim-char-in"
                                  style="animation-delay: {800 + (i * 30)}ms">
                                {char === " " ? "\u00A0" : char}
                            </span>
                        {/each}
                    </div>
                </div>
                
                <div class="flex items-center text-[16px] font-bold text-black/70 dark:text-white/70 h-6 mb-2">
                    <span class="anim-fade-in delay-y-start">{oldestDate.getFullYear()}</span>
                    <div class="year-connector anim-grow-line delay-y-line"></div>
                    <span class="anim-fade-in delay-y-end">{newestDate.getFullYear()}</span>
                </div>
                
                <div class="flex flex-col items-center justify-center -mt-0.5 anim-fade-in delay-number">
                    <span class="inline-block font-medium text-[56px] leading-[0.9] tabular-nums tracking-[-0.05em] text-[var(--primary)] {isPopping ? 'anim-pop' : ''}">
                        {Math.round(displayCount)}
                    </span>
                    <span class="mt-2 text-[14px] font-bold text-black/40 dark:text-white/40 uppercase">
                        게시물
                    </span>
                </div>
            </div>
        {/if}
    </div>

    {#each groups as group}
        <div class="mb-8 last:mb-0">
            <div class="flex flex-row justify-start items-center px-2 gap-2 h-[3.75rem]">
                <div class="w-[17%] md:w-[10%] transition text-2xl font-semibold text-right text-75">{group.year}</div>
                <div class="w-[13%] md:w-[10%] relative flex items-center justify-center shrink-0">
                    <span class="text-black/60 dark:text-white/60 tracking-[0.2em] font-bold select-none text-xs -translate-y-[3px]">.....</span>
                </div>
                <div class="flex-1 transition text-left text-50 text-base md:text-base flex items-center">
                    <span class="text-[var(--primary)] font-bold mr-1">{group.posts.length}</span>
                    <span class="opacity-60">{i18n(group.posts.length === 1 ? I18nKey.postCount : I18nKey.postsCount)}</span>
                </div>
            </div>
            <div class="mt-2 space-y-1">
                {#each group.posts as post}
                    <a href={getPostUrlBySlug(post.slug)} class="group btn-plain !block h-auto w-full rounded-lg overflow-hidden py-2.5">
                        <div class="flex flex-row justify-start items-center px-2 gap-2">
                            <div class="w-[17%] md:w-[10%] transition text-sm text-right text-50 shrink-0 leading-none">{formatDate(post.data.published)}</div>
                            <div class="w-[13%] md:w-[10%] relative dash-line flex items-center shrink-0">
                                <div class="transition-all mx-auto w-1.5 h-1.5 rounded-full group-hover:h-5 bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)] z-50"></div>
                            </div>
                            <div class:list={["flex-1 min-w-0 text-left font-medium group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)] text-75 pr-4 line-clamp-3 break-keep text-balance leading-tight"]}>
                                {#if post.data.category}
                                    <span class="text-[11px] font-bold capitalize text-black/70 dark:text-white/80 mr-1 inline-block translate-y-[-1px] border border-black/15 dark:border-white/20 bg-black/[0.08] dark:bg-white/[0.08] px-1.5 py-0.5 rounded-md leading-none">
                                        {post.data.category.split('/').pop()}
                                    </span>
                                {/if}
                                <span>{post.data.title}</span>
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/each}
</div>

<style>
    .year-connector { width: 0; height: 1.25px; background: #888; opacity: 0; margin: 0 12px; display: inline-block; visibility: hidden; }
    @keyframes grow-line {
        0% { width: 0; opacity: 0; visibility: visible; }
        100% { width: 32px; opacity: 0.6; visibility: visible; }
    }
    .anim-grow-line { animation: grow-line 1s cubic-bezier(0.33, 1, 0.68, 1) both; }

    .delay-y-start { animation-delay: 1400ms; }
    .delay-y-line  { animation-delay: 1600ms; }
    .delay-y-end   { animation-delay: 1800ms; }
    .delay-number  { animation-delay: 2200ms; }

    @keyframes pop-effect {
        0% { transform: scale(1); }
        10% { transform: scale(1.3); }   /* 1차 박동: 팡! */
        20% { transform: scale(0.9); }   /* 1차 수축 */
        30% { transform: scale(1.2); }   /* 2차 박동: 팝! */
        40% { transform: scale(0.95); }  /* 2차 수축 */
        50% { transform: scale(1.1); }   /* 3차 박동: 툭 */
        60% { transform: scale(0.97); }  /* 3차 수축 */
        70% { transform: scale(1.06); }  /* 4차 박동: 잔상 */
        80% { transform: scale(0.985); } /* 4차 수축 */
        90% { transform: scale(1.03); }  /* 5차 박동: 미세 여운 */
        95% { transform: scale(0.995); } /* 5차 수축 */
        98% { transform: scale(1.012); } /* 6차 박동: 찰나의 떨림 */
        100% { transform: scale(1); }    /* 최종 안착 */
    }
    .anim-pop {
        display: inline-block;
        will-change: transform;
        animation: pop-effect 1.4s ease-in-out forwards;
    }
</style>
<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { url } from "@utils/url-utils.ts";
import FlexSearch from "flexsearch";
import { onMount, untrack } from "svelte";

/**
 * [FlexSearch 검색 시스템 - 경로 집중형 버전]
 * 1. 경로 표시: 날짜를 제거하고 '생각의 위치(Path)'에만 집중.
 * 2. 32px 정렬: 모든 요소의 시작점을 일치시켜 시각적 신뢰도 향상.
 * 3. 클린 UX: 불필요한 메타데이터를 걷어낸 미니멀리즘 디자인.
 */

interface SearchData {
	title: string;
	description: string;
	category: string;
	tags: string[];
	url: string;
	content: string;
}

interface IndexResult {
	field: string;
	result: (string | { id: string })[];
}

let keyword = $state("");
let searchResults = $state<SearchData[]>([]);
let isSearching = $state(false);
let isMobileInputVisible = $state(false);
let isDesktopPanelVisible = $state(false);
let showNoResults = $state(false);
// biome-ignore lint/suspicious/noExplicitAny: FlexSearch Document instance is hard to type
let index: any = null;
let rawData: SearchData[] = [];
let isInitialized = $state(false);
let isFocused = $state(false); // 데스크톱 입력창 포커스 상태 추적
let desktopInput: HTMLInputElement | undefined = $state(); // 데스크톱 입력창 바인딩
let mobileInput: HTMLInputElement | undefined = $state();
let noResultsTimeout: ReturnType<typeof setTimeout> | undefined;
let timer: ReturnType<typeof setTimeout> | undefined; // 타이머 변수를 상위 스코프로 이동

const highlight = (text: string, query: string) => {
	if (!text || !query) return text;
	const q = query.trim();
	if (!q) return text;

	try {
		const cleanText = text.split(/\s+/).join(" ").trim();
		const specialChars = [
			".",
			"*",
			"+",
			"?",
			"^",
			"$",
			"{",
			"}",
			"(",
			")",
			"|",
			"[",
			"]",
			"\\",
		];
		const escaped = q
			.split("")
			.map((c) => (specialChars.includes(c) ? `\\${c}` : c))
			.join("");
		const regex = new RegExp(`(${escaped})`, "gi");
		return cleanText.replace(
			regex,
			'<span class="text-[var(--primary)] font-bold">$1</span>',
		);
	} catch (e) {
		return text;
	}
};

const formatPath = (category: string) => {
	if (!category) return "";
	return category.replace(/\.md$/, "").split("/").join(" > ");
};

const getDisplaySnippet = (item: SearchData, query: string) => {
	if (!query.trim()) return "";
	const q = query.trim().toLowerCase();

	// 오직 본문(Content)에 키워드가 포함되어 있을 때만 스니펫 추출
	const contentLower = item.content.toLowerCase();
	const matchIndex = contentLower.indexOf(q);

	if (matchIndex !== -1) {
		const start = Math.max(0, matchIndex - 40);
		const end = Math.min(item.content.length, matchIndex + 70);
		let snippet = item.content.substring(start, end);

		if (start > 0) snippet = `...${snippet}`;
		if (end < item.content.length) snippet += "...";

		return highlight(snippet, query);
	}

	// 제목 매칭 등 기본 상황에서는 아무것도 표시하지 않음 (설명 숨김)
	return "";
};

const initSearch = async () => {
	if (isInitialized) return;
	try {
		let dataPath = url("/search.json");
		if (dataPath.includes("//")) {
			dataPath = dataPath.split("/").filter(Boolean).join("/");
			if (url("/").startsWith("/")) dataPath = `/${dataPath}`;
		}
		const response = await fetch(dataPath);
		rawData = await response.json();
		const FlexSearchLib =
			(FlexSearch as unknown as { default: typeof FlexSearch }).default ||
			FlexSearch;
		index = new FlexSearchLib.Document({
			tokenize: "full",
			document: {
				id: "url",
				store: ["title", "description", "category", "url"],
				index: ["title", "description", "category", "tags", "content"],
			},
		});
		rawData.forEach((item) => {
			index.add(item);
		});
		isInitialized = true;
	} catch (e) {
		console.error("[Search] Init failed:", e);
	}
};

const performSearch = (kw: string) => {
	const trimmed = kw.trim();
	clearTimeout(noResultsTimeout);
	if (!trimmed || !index) {
		searchResults = [];
		showNoResults = false;
		isDesktopPanelVisible = false;
		return;
	}
	isSearching = true;
	showNoResults = false;

	// 포커스가 있거나 모바일인 경우에만 패널 노출
	if (isFocused || isMobileInputVisible) {
		isDesktopPanelVisible = true;
	}

	try {
		const results = index.search(trimmed, { limit: 10, enrich: true });
		const matchedItems: SearchData[] = [];
		const seenUrls = new Set();
		if (results) {
			results.forEach((categoryResult: IndexResult) => {
				categoryResult.result.forEach((res) => {
					const id = typeof res === "object" ? res.id : res;
					if (!seenUrls.has(id)) {
						const item = rawData.find((d) => d.url === id);
						if (item) matchedItems.push(item);
						seenUrls.add(id);
					}
				});
			});
		}
		searchResults = matchedItems;
		if (searchResults.length === 0) {
			noResultsTimeout = setTimeout(() => {
				showNoResults = true;
			}, 500);
		}
	} finally {
		isSearching = false;
	}
};

const closeSearch = (e?: MouseEvent) => {
	if (e) e.stopPropagation();
	isMobileInputVisible = false;
	isDesktopPanelVisible = false;
	keyword = "";
	searchResults = [];
	showNoResults = false;
	clearTimeout(timer); // 닫을 때 타이머 취소 추가
	document.body.style.overflow = "";
	if (mobileInput) mobileInput.blur();
};

const handleNavigate = (e: MouseEvent, targetUrl: string) => {
	e.preventDefault();
	e.stopPropagation();
	closeSearch();
	const win = window as Window & { swup?: { navigate: (url: string) => void } };
	if (win.swup) {
		win.swup.navigate(targetUrl);
	} else {
		window.location.href = targetUrl;
	}
};

onMount(() => {
	initSearch();
	const handleGlobalClick = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		const wrapper = document.getElementById("search-wrapper");
		if (wrapper && !wrapper.contains(target)) {
			// 외부 클릭 시 지연된 검색 실행이 있다면 즉시 취소
			clearTimeout(timer);

			if (showNoResults) {
				// 결과가 없는 상태(No results)에서 외부 클릭 시 필드 초기화
				closeSearch();
			} else if (isMobileInputVisible) {
				// 결과가 있는 상태에서 모바일 백드롭 클릭 시 텍스트 유지하고 창만 닫음
				isMobileInputVisible = false;
				document.body.style.overflow = "";
			} else {
				// 결과가 있는 상태에서 데스크톱 외부 클릭 시 텍스트 유지하고 패널만 닫음
				isDesktopPanelVisible = false;
			}
		}
	};

	// 페이지 이동 시 검색 상태 초기화
	const handleNavigateAway = () => {
		closeSearch();
	};

	document.addEventListener("click", handleGlobalClick);
	document.addEventListener("swup:content:replace", handleNavigateAway);
	document.addEventListener("astro:after-swap", handleNavigateAway);

	return () => {
		document.removeEventListener("click", handleGlobalClick);
		document.removeEventListener("swup:content:replace", handleNavigateAway);
		document.removeEventListener("astro:after-swap", handleNavigateAway);
		clearTimeout(timer);
	};
});

$effect(() => {
	const kw = keyword;
	if (!isInitialized) return;
	clearTimeout(timer);
	timer = setTimeout(() => {
		untrack(() => performSearch(kw));
	}, 200);
});

$effect(() => {
	if (isMobileInputVisible) {
		document.body.style.overflow = "hidden";
		setTimeout(() => mobileInput?.focus(), 100);
	}
});
</script>

<div id="search-wrapper" class="flex items-center">
    <!-- 1. 데스크탑 검색바 -->
    <div 
        onclick={() => desktopInput?.focus()}
        role="presentation"
        class="hidden lg:flex relative items-center h-10 px-3 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] w-[265px] cursor-text"
    >
        <Icon icon="material-symbols:search" class="text-[1.2rem] text-black/60 dark:text-white/60" />
        <input 
            bind:this={desktopInput}
            type="text"
            placeholder="{i18n(I18nKey.search)}" 
            bind:value={keyword}
            onfocus={() => { isFocused = true; if (keyword.trim()) isDesktopPanelVisible = true; }}
            onblur={() => { isFocused = false; }}
            onclick={(e) => { e.stopPropagation(); if (keyword.trim()) isDesktopPanelVisible = true; }}
            class="ml-2 w-full bg-transparent outline-none text-sm font-medium text-black/90 dark:text-white/90 placeholder:text-black/50 dark:placeholder:text-white/50"
        />
    </div>

    <!-- 2. 모바일 토글 버튼 -->
    <button onclick={(e) => { e.stopPropagation(); isMobileInputVisible = true; }}
        class="lg:hidden flex items-center justify-center w-12 h-12 rounded-lg active:bg-black/5 dark:active:bg-white/5 transition-all active:scale-90"
        aria-label="Open Search">
        <Icon icon="material-symbols:search" class="text-[1.5rem] text-black/60 dark:text-white/60" />
    </button>

    <!-- 3. 모바일 패널 -->
    {#if isMobileInputVisible}
        <div id="search-backdrop" 
             class="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] animate-fade-in" 
             onclick={closeSearch}
             onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') closeSearch(); }}
             role="button"
             tabindex="0"
             aria-label="Close Search"></div>
        <div class="lg:hidden fixed top-[80px] left-4 right-4 bg-[var(--card-bg)] border border-[var(--line-color)] z-[1001] shadow-2xl animate-slide-down rounded-xl overflow-hidden"
             onclick={(e) => e.stopPropagation()}
             role="presentation">
            <div class="flex items-center p-4">
                <div class="w-full flex items-center h-12 px-4 rounded-xl bg-black/[0.05] dark:bg-white/[0.08]">
                    <Icon icon="material-symbols:search" class="text-[1.2rem] text-black/60 dark:text-white/60" />
                    <input bind:this={mobileInput} type="text" placeholder="무엇을 찾으시나요?" bind:value={keyword}
                        class="ml-3 w-full bg-transparent outline-none text-base font-bold text-black/90 dark:text-white/90" />
                </div>
            </div>

            {#if keyword.trim()}
                <div class="max-h-[55vh] overflow-y-auto pb-4 scrollbar-hide">
                    <div class="mx-8 border-t border-[var(--line-color)] mb-3 opacity-50"></div>
                    <div class="flex flex-col gap-1.5 px-4">
                        {#if isSearching}
                            <div class="py-12 text-center text-50 italic flex items-center justify-center gap-2 text-xs"><Icon icon="svg-spinners:ring-resize" class="text-xl" /> 검색 중...</div>
                        {:else if searchResults.length > 0}
                            {#each searchResults as item}
                                <a href={item.url} onclick={(e) => handleNavigate(e, item.url)}
                                   class="block p-4 px-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] active:bg-[var(--btn-plain-bg-hover)] transition-colors">
                                    <div class="text-[10px] text-50 font-semibold uppercase tracking-wider mb-1">
                                        {formatPath(item.category)}
                                    </div>
                                    <div class="text-90 font-bold text-sm leading-tight">{@html highlight(item.title, keyword)}</div>
                                    {#if getDisplaySnippet(item, keyword)}
                                        <div class="text-[11px] text-50 line-clamp-2 mt-2 leading-relaxed">
                                            {@html getDisplaySnippet(item, keyword)}
                                        </div>
                                    {/if}
                                </a>
                            {/each}
                        {:else if showNoResults}
                            <div class="py-16 text-center flex flex-col items-center justify-center gap-3">
                                <Icon icon="material-symbols:search-off-rounded" class="text-4xl text-black/20 dark:text-white/20" />
                                <div class="text-50 text-sm italic font-medium px-4">"{keyword}"에 대한 결과를 찾을 수 없습니다.</div>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    {/if}

    <!-- 4. 데스크톱 패널 -->
    <div class="hidden lg:block">
        {#if keyword.trim() && !isMobileInputVisible && isDesktopPanelVisible}
            <div class="absolute top-14 right-0 w-[32rem] bg-[var(--card-bg)] shadow-2xl rounded-2xl p-2 border border-[var(--line-color)] z-[100]">
                <div class="max-h-[60vh] overflow-y-auto flex flex-col scrollbar-hide p-1 gap-1">
                    {#if isSearching}
                        <div class="py-12 text-center text-50 italic flex items-center justify-center gap-2 text-xs"><Icon icon="svg-spinners:ring-resize" class="text-xl" /> 검색 중...</div>
                    {:else if searchResults.length > 0}
                        {#each searchResults as item}
                            <a href={item.url} onclick={(e) => handleNavigate(e, item.url)}
                               class="group block p-3 px-4 rounded-xl hover:bg-[var(--btn-plain-bg-hover)] transition-all">
                                <div class="text-[9px] text-50 font-semibold uppercase tracking-tight mb-1 opacity-70">
                                    {formatPath(item.category)}
                                </div>
                                <div class="flex justify-between items-center">
                                    <div class="text-90 font-bold flex items-center transition-colors">
                                        <span class="group-hover:text-[var(--primary)] transition-colors">{@html highlight(item.title, keyword)}</span>
                                        <Icon icon="fa6-solid:chevron-right" class="text-[0.6rem] text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-all ml-2" />
                                    </div>
                                </div>
                                {#if getDisplaySnippet(item, keyword)}
                                    <div class="text-[11px] text-50 line-clamp-1 mt-1 font-medium">
                                        {@html getDisplaySnippet(item, keyword)}
                                    </div>
                                {/if}
                            </a>
                        {/each}
                    {:else if showNoResults}
                        <div class="py-12 text-center flex flex-col items-center justify-center gap-3">
                            <Icon icon="material-symbols:search-off-rounded" class="text-4xl text-black/20 dark:text-white/20" />
                            <div class="text-50 text-sm italic font-medium px-4">"{keyword}"에 대한 결과를 찾을 수 없습니다.</div>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes slide-down { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .animate-slide-down { animation: slide-down 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
</style>
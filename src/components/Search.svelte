<script lang="ts">
import Icon from "@iconify/svelte";
import { url } from "@utils/url-utils.ts";
import FlexSearch from "flexsearch";
import { onMount, untrack } from "svelte";

/**
 * [FlexSearch 검색 결과 패널 - UI 전용]
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

// 모듈 스코프 캐시
let indexInstance: any = null;
let rawDataCache: SearchData[] = [];
let globalInitialized = false;

// 상태 관리
let keyword = $state("");
let searchResults = $state<SearchData[]>([]);
let isSearching = $state(false);
let showNoResults = $state(false);
let isVisible = $state(false); // 패널 노출 여부
let inputEl: HTMLInputElement | undefined = $state();
let timer: ReturnType<typeof setTimeout> | undefined;

// 외부에서 패널을 열 수 있도록 함수 노출 (window 객체 활용)
export const openSearch = () => {
    isVisible = true;
    setTimeout(() => inputEl?.focus(), 100);
};

if (typeof window !== 'undefined') {
    (window as any).openSearch = openSearch;
}

const highlight = (text: string, query: string) => {
	if (!text || !query) return text;
	const q = query.trim();
	if (!q) return text;
	try {
		const cleanText = text.split(/\s+/).join(" ").trim();
		const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const regex = new RegExp(`(${escaped})`, "gi");
		return cleanText.replace(regex, '<span class="text-[var(--primary)] font-bold">$1</span>');
	} catch (e) { return text; }
};

const formatPath = (category: string) => {
	if (!category) return "";
	return category.replace(/\.md$/, "").split("/").join(" > ");
};

const getDisplaySnippet = (item: SearchData, query: string) => {
	if (!query.trim()) return "";
	const q = query.trim().toLowerCase();
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
	return "";
};

const initSearch = async () => {
	if (globalInitialized) return;
	try {
		const response = await fetch(url("/search.json"));
		rawDataCache = await response.json();
		const FlexSearchLib = (FlexSearch as any).default || FlexSearch;
		indexInstance = new FlexSearchLib.Document({
			tokenize: "full",
			document: {
				id: "url",
				store: ["title", "description", "category", "url"],
				index: ["title", "description", "category", "tags", "content"],
			},
		});
		rawDataCache.forEach((item) => indexInstance.add(item));
		globalInitialized = true;
	} catch (e) { console.error("[Search] Init failed:", e); }
};

const performSearch = (kw: string) => {
	const trimmed = kw.trim();
	if (!trimmed || !indexInstance) {
		searchResults = [];
		showNoResults = false;
		return;
	}
	isSearching = true;
	showNoResults = false;
	try {
		const results = indexInstance.search(trimmed, { limit: 10, enrich: true });
		const matchedItems: SearchData[] = [];
		const seenUrls = new Set();
		if (results) {
			results.forEach((categoryResult: IndexResult) => {
				categoryResult.result.forEach((res) => {
					const id = typeof res === "object" ? (res as any).id : res;
					if (!seenUrls.has(id)) {
						const item = rawDataCache.find((d) => d.url === id);
						if (item) matchedItems.push(item);
						seenUrls.add(id);
					}
				});
			});
		}
		searchResults = matchedItems;
		if (searchResults.length === 0) {
            setTimeout(() => { if (keyword.trim()) showNoResults = true; }, 500);
        }
	} finally { isSearching = false; }
};

const closeSearch = () => {
	isVisible = false;
	keyword = "";
	searchResults = [];
	showNoResults = false;
	document.body.style.overflow = "";
};

const handleNavigate = (e: MouseEvent, targetUrl: string) => {
	e.preventDefault();
    e.stopPropagation(); // 이벤트 전파 차단
	closeSearch();
    
    // Swup을 통한 부드러운 이동 (존재할 경우)
    const swup = (window as any).swup;
    if (swup && typeof swup.navigate === 'function') {
        swup.navigate(targetUrl);
    } else {
        window.location.href = targetUrl;
    }
};

onMount(() => {
	initSearch();
    const handleGlobalClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (isVisible && !target.closest('.search-panel-content')) {
            closeSearch();
        }
    };
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch(); };
    
    document.addEventListener("click", handleGlobalClick);
    document.addEventListener("keydown", handleEscape);
	return () => {
        document.removeEventListener("click", handleGlobalClick);
        document.removeEventListener("keydown", handleEscape);
    };
});

$effect(() => {
	const kw = keyword;
	clearTimeout(timer);
	timer = setTimeout(() => untrack(() => performSearch(kw)), 200);
});

$effect(() => {
	if (isVisible) document.body.style.overflow = "hidden";
});
</script>

{#if isVisible}
    <div id="search-backdrop" 
         class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000] animate-fade-in" 
         onclick={closeSearch}
         role="presentation"></div>
    <div class="search-panel-content fixed top-[20px] md:top-[12vh] left-1/2 -translate-x-1/2 w-[92%] md:w-[600px] max-w-[calc(100vw-2rem)] bg-[var(--card-bg)] border border-[var(--line-color)] z-[2001] shadow-2xl animate-slide-down rounded-2xl overflow-hidden"
         onclick={(e) => e.stopPropagation()}
         role="presentation">
        <div class="flex items-center p-3 md:p-4">
            <div class="w-full flex items-center h-12 px-4 rounded-xl bg-black/[0.05] dark:bg-white/[0.08]">
                <Icon icon="material-symbols:search" class="text-[1.2rem] text-black/60 dark:text-white/60" />
                <input bind:this={inputEl} type="text" placeholder="검색어를 입력하세요..." bind:value={keyword}
                    class="ml-3 w-full bg-transparent outline-none text-base font-bold text-black/90 dark:text-white/90" />
                {#if keyword}
                    <button onclick={() => { keyword = ""; inputEl?.focus(); }} class="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                        <Icon icon="material-symbols:close-rounded" class="text-xl text-black/40" />
                    </button>
                {/if}
            </div>
        </div>

        {#if keyword.trim()}
            <div class="max-h-[60vh] overflow-y-auto pb-4 scrollbar-hide">
                <div class="mx-8 border-t border-[var(--line-color)] mb-3 opacity-50"></div>
                <div class="flex flex-col gap-1.5 px-3 md:px-4">
                    {#if isSearching}
                        <div class="py-12 text-center text-50 italic flex items-center justify-center gap-2 text-xs"><Icon icon="svg-spinners:ring-resize" class="text-xl" /> 검색 중...</div>
                    {:else if searchResults.length > 0}
                        {#each searchResults as item}
                            <a href={item.url} onclick={(e) => handleNavigate(e, item.url)}
                               class="group block p-4 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.03] active:bg-[var(--btn-plain-bg-hover)] transition-all border border-transparent hover:border-[var(--line-color)]">
                                <div class="text-[10px] text-50 font-semibold uppercase tracking-wider mb-1 opacity-70">
                                    {formatPath(item.category)}
                                </div>
                                <div class="text-90 font-bold text-sm md:text-base leading-tight group-hover:text-[var(--primary)] transition-colors">
                                    {@html highlight(item.title, keyword)}
                                </div>
                                {#if getDisplaySnippet(item, keyword)}
                                    <div class="text-[11px] md:text-xs text-50 line-clamp-2 mt-2 leading-relaxed opacity-80 font-medium">
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

<style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes slide-down { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .animate-slide-down { animation: slide-down 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
</style>
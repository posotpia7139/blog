import { OverlayScrollbars } from 'overlayscrollbars';
import { getHue, getStoredTheme, setHue, setTheme } from "./setting-utils";
import { pathsEqual, url } from "./url-utils";
import { siteConfig } from '../config';

/**
 * 전역 초기화 함수
 */
export function init() {
    setTheme(getStoredTheme());
    setHue(getHue());

    const bodyElement = document.querySelector('body');
    if (bodyElement) {
        if (pathsEqual(window.location.pathname, url('/'))) {
            bodyElement.classList.add('lg:is-home');
        } else {
            bodyElement.classList.remove('lg:is-home');
        }
    }

    // 스크롤바 초기화 (데스크톱 전용)
    if (bodyElement && window.innerWidth >= 1024) {
        requestAnimationFrame(() => {
            if (!(window as any).osInstance) {
                (window as any).osInstance = OverlayScrollbars(bodyElement, {
                    scrollbars: {
                        theme: 'scrollbar-base scrollbar-auto py-1',
                        autoHide: 'never',
                    },
                    overflow: { x: 'hidden', y: 'scroll' }
                });
            } else {
                (window as any).osInstance.update(true);
            }
        });
    } else if (bodyElement && (window as any).osInstance) {
        (window as any).osInstance.destroy();
        (window as any).osInstance = null;
    }

    setupAnchorLinks();
    initContentEnhancements();
}

/**
 * 콘텐츠 강화 기능 초기화 (Footnotes, KaTeX, Banner)
 */
export function initContentEnhancements() {
    requestAnimationFrame(() => {
        initFootnotes();
        processKaTeX();
        showBanner();
    });
}

function showBanner() {
    if (!siteConfig.banner.enable) return;
    const banner = document.getElementById('banner');
    if (banner) banner.classList.remove('opacity-0', 'scale-105');
}

function initFootnotes() {
    const inlineRefs = document.querySelectorAll('a[id^="user-content-fnref-"]');
    inlineRefs.forEach(ref => {
        if (ref.querySelector('span')) return;
        const num = ref.textContent;
        ref.innerHTML = `<span>[</span>${num}<span>]</span>`;
    });

    const footnotes = document.querySelectorAll('section[data-footnotes] ol li');
    footnotes.forEach((li, index) => {
        if (li.querySelector('.custom-footnote-link')) return;
        const backref = li.querySelector('.data-footnote-backref');
        if (!backref) return;
        const href = backref.getAttribute('href');
        const num = index + 1;
        const newLink = document.createElement('a');
        newLink.href = href || '#';
        newLink.className = 'custom-footnote-link';
        newLink.innerHTML = `<span>[</span>${num}<span>]</span>`;
        const p = li.querySelector('p');
        if (p) p.prepend(newLink, ' ');
        else li.prepend(newLink, ' ');
    });
}

function setupAnchorLinks() {
    const anchors = document.querySelectorAll('.anchor-link');
    anchors.forEach(anchor => {
        if ((anchor as HTMLElement).dataset.copyLinkBound === 'true') return;
        (anchor as HTMLElement).dataset.copyLinkBound = 'true';

        anchor.addEventListener('click', async (e) => {
            e.preventDefault();
            const href = anchor.getAttribute('href');
            const url = window.location.origin + window.location.pathname + href;
            try {
                await navigator.clipboard.writeText(url);
                const targetId = href?.substring(1);
                const target = document.getElementById(targetId || "");
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    history.pushState(null, '', href);
                }
            } catch (err) { console.error(err); }
        });
    });
}

export function processKaTeX() {
    const katexElements = document.querySelectorAll('.katex-display') as NodeListOf<HTMLElement>;
    katexElements.forEach(element => {
        if (!element.parentNode || element.hasAttribute('data-scrollbar-initialized')) return;
        const container = document.createElement('div');
        container.className = 'katex-display-container';
        element.parentNode.insertBefore(container, element);
        container.appendChild(element);
        OverlayScrollbars(container, {
            scrollbars: { theme: 'scrollbar-base scrollbar-auto', autoHide: 'never' }
        });
        element.setAttribute('data-scrollbar-initialized', 'true');
    });
}

/**
 * 클릭 외부 닫기 처리
 */
export function setupClickOutside() {
    document.addEventListener("click", event => {
        const targets = ["display-setting", "nav-menu-panel", "search-panel"];
        const ignores = [
            ["display-setting", "display-settings-switch"],
            ["nav-menu-panel", "nav-menu-switch", "scheme-switch"],
            ["search-panel", "search-bar", "search-switch"]
        ];

        targets.forEach((id, idx) => {
            const panelDom = document.getElementById(id);
            if (!panelDom) return;
            let tDom = event.target;
            if (!(tDom instanceof Node)) return;
            const shouldIgnore = ignores[idx].some(igId => {
                const ie = document.getElementById(igId);
                return ie === tDom || ie?.contains(tDom);
            });
            if (!shouldIgnore) panelDom.classList.add("float-panel-closed");
        });
    });
}

/**
 * 내비게이션 바 스크롤 제어
 */
export function setupScrollNavbar(bannerEnabled: boolean, BANNER_HEIGHT: number) {
    function scrollFunction() {
        const navbar = document.getElementById('navbar');
        if (!bannerEnabled || !navbar) return;
        const NAVBAR_HEIGHT = 72;
        const threshold = window.innerHeight * (BANNER_HEIGHT / 100) - NAVBAR_HEIGHT - (3.5 * 16) - 16;
        if (document.body.scrollTop >= threshold || document.documentElement.scrollTop >= threshold) {
            navbar.classList.add('navbar-hidden');
        } else {
            navbar.classList.remove('navbar-hidden');
        }
    }
    window.addEventListener('scroll', () => window.requestAnimationFrame(scrollFunction));
}

/**
 * PhotoSwipe 라이브러리 초기화
 */
export async function initPhotoSwipe() {
    const PhotoSwipeLightbox = (await import("photoswipe/lightbox")).default;
    const pswp = import("photoswipe");
    
    const lightbox = new PhotoSwipeLightbox({
        gallery: ".custom-md img, #post-cover img",
        pswpModule: () => pswp,
    });
    lightbox.init();
}

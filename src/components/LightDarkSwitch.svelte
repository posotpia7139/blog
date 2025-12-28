<script lang="ts">
import { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants.ts";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import {
	applyThemeToDocument,
	getStoredTheme,
	setTheme,
} from "@utils/setting-utils.ts";
import { onMount } from "svelte";
import type { LIGHT_DARK_MODE } from "@/types/config.ts";

// [Svelte 5] Props 정의
let { ...props } = $props();

// [Svelte 5] 상태 관리
let mode: LIGHT_DARK_MODE = $state(AUTO_MODE);

onMount(() => {
	mode = getStoredTheme();
	const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)");
	
	const changeThemeWhenSchemeChanged = (e: MediaQueryListEvent) => {
		if (mode === AUTO_MODE) {
			applyThemeToDocument(AUTO_MODE);
		}
	};

	darkModePreference.addEventListener("change", changeThemeWhenSchemeChanged);
	return () => {
		darkModePreference.removeEventListener("change", changeThemeWhenSchemeChanged);
	};
});

function switchScheme(newMode: LIGHT_DARK_MODE) {
	mode = newMode;
	setTheme(newMode);
}

function toggleScheme() {
	if (mode === AUTO_MODE) {
		if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			switchScheme(LIGHT_MODE);
		} else {
			switchScheme(DARK_MODE);
		}
	} else if (mode === LIGHT_MODE) {
		switchScheme(DARK_MODE);
	} else {
		switchScheme(LIGHT_MODE);
	}
}
</script>

<!-- z-50 make the panel higher than other float panels -->
<div class="relative z-50" role="menu" tabindex="-1">
    <button aria-label="Light/Dark Mode" role="menuitem" 
            class="relative btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90" 
            id="scheme-switch" 
            onclick={toggleScheme}>
        <div class="absolute transition-opacity duration-300" class:opacity-0={mode !== LIGHT_MODE} class:opacity-100={mode === LIGHT_MODE}>
            <Icon icon="material-symbols:wb-sunny-outline-rounded" class="text-[1.25rem]"></Icon>
        </div>
        <div class="absolute transition-opacity duration-300" class:opacity-0={mode !== DARK_MODE} class:opacity-100={mode === DARK_MODE}>
            <Icon icon="material-symbols:dark-mode-outline-rounded" class="text-[1.25rem]"></Icon>
        </div>
        <div class="absolute transition-opacity duration-300" class:opacity-0={mode !== AUTO_MODE} class:opacity-100={mode === AUTO_MODE}>
            <Icon icon="material-symbols:radio-button-partial-outline" class="text-[1.25rem]"></Icon>
        </div>
    </button>
</div>

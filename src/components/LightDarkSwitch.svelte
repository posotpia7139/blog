<script lang="ts">
import { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants.ts";
import Icon from "@iconify/svelte";
import {
	applyThemeToDocument,
	getStoredTheme,
	setTheme,
} from "@utils/setting-utils.ts";
import { onMount } from "svelte";
import type { LIGHT_DARK_MODE } from "@/types/config.ts";

// [Svelte 5] 상태 관리
let mode: LIGHT_DARK_MODE = $state(AUTO_MODE);

onMount(() => {
	mode = getStoredTheme();
	const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)");

	const changeThemeWhenSchemeChanged = (_e: MediaQueryListEvent) => {
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

function toggleScheme(e: MouseEvent) {
	if (e) e.stopPropagation();
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

<div class="relative z-50 shrink-0" role="menu" tabindex="-1">
    <button aria-label="Light/Dark Mode" role="menuitem" 
            class="relative btn-plain rounded-lg h-11 w-11 active:scale-90 flex items-center justify-center transition-all shrink-0" 
            id="scheme-switch" 
            onclick={(e) => toggleScheme(e)}>
        <div class="absolute inset-0 flex items-center justify-center transition-opacity duration-300" class:opacity-0={mode !== LIGHT_MODE} class:opacity-100={mode === LIGHT_MODE}>
            <Icon icon="material-symbols:wb-sunny-outline-rounded" class="text-[1.5rem]"></Icon>
        </div>
        <div class="absolute inset-0 flex items-center justify-center transition-opacity duration-300" class:opacity-0={mode !== DARK_MODE} class:opacity-100={mode === DARK_MODE}>
            <Icon icon="material-symbols:dark-mode-outline-rounded" class="text-[1.5rem]"></Icon>
        </div>
        <div class="absolute inset-0 flex items-center justify-center transition-opacity duration-300" class:opacity-0={mode !== AUTO_MODE} class:opacity-100={mode === AUTO_MODE}>
            <Icon icon="material-symbols:radio-button-partial-outline" class="text-[1.5rem]"></Icon>
        </div>
    </button>
</div>

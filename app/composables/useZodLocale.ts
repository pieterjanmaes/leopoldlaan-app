import type { Composer } from 'vue-i18n';
import * as z from 'zod';
import { fr, nl } from 'zod/locales';

// Zod's own validation messages in the site's language. Called by the forms that validate
// with Zod rather than from a global plugin: a plugin put Zod and its locales in the entry
// bundle of every page. `z.config` is global, so a second form re-applies it harmlessly.
export function useZodLocale(): void {
	const i18n = useNuxtApp().$i18n as Composer;

	const applyZodLocale = () => {
		z.config(i18n.locale.value === 'fr' ? fr() : nl());
	};

	applyZodLocale();
	watch(i18n.locale, applyZodLocale);
}

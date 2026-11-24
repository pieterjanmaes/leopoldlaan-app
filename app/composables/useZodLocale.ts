import * as z from 'zod';
import { nl } from 'zod/locales';

// Zod's own validation messages in Dutch. Called by the forms that validate with Zod rather than from a global
// plugin: a plugin put Zod and its locales in the entry bundle of every page.
export function useZodLocale(): void {
	z.config(nl());
}

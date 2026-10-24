import { mountSuspended } from '@nuxt/test-utils/runtime';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import type { Composer } from 'vue-i18n';
import * as z from 'zod';

const setLocale = (locale: 'nl' | 'fr') => (useNuxtApp().$i18n as Composer).setLocale(locale);

const requiredMessage = () => z.string().safeParse(undefined).error?.issues[0]?.message;

// useZodLocale has to run inside a component's setup, like the forms call it
const Form = defineComponent({
	setup() {
		useZodLocale();
		return () => null;
	}
});

describe('useZodLocale', () => {
	afterEach(async () => {
		await setLocale('nl');
	});

	it('gives Zod Dutch messages on the Dutch site', async () => {
		await mountSuspended(Form);

		expect(requiredMessage()).toMatch(/verwacht/i);
	});

	it('switches Zod to French when the locale changes', async () => {
		await mountSuspended(Form);
		await setLocale('fr');
		await nextTick();

		expect(requiredMessage()).toMatch(/attendu/i);
	});
});

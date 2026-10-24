import { mountSuspended } from '@nuxt/test-utils/runtime';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import type { Composer } from 'vue-i18n';

import { CPhoneNumberInput } from '#components';

const setLocale = (locale: 'nl') => (useNuxtApp().$i18n as Composer).setLocale(locale);

describe('CPhoneNumberInput', () => {
	afterEach(async () => {
		await setLocale('nl');
	});

	it('starts on the locale country (nl-BE → +32) with a Belgian example as placeholder', async () => {
		const wrapper = await mountSuspended(CPhoneNumberInput);

		expect(wrapper.text()).toContain('+32');
		expect(wrapper.find('input[type="tel"]').attributes('placeholder')).toBe('0450 00 12 34');
	});

	it('emits the number in E.164 and shows it formatted nationally', async () => {
		const wrapper = await mountSuspended(CPhoneNumberInput);
		const input = wrapper.find('input[type="tel"]');

		await input.setValue('0470123456');

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['+32470123456']);
		expect((input.element as HTMLInputElement).value).toBe('0470 12 34 56');
	});

	it('switches the country when an international number is typed', async () => {
		const wrapper = await mountSuspended(CPhoneNumberInput);

		await wrapper.find('input[type="tel"]').setValue('+33612345678');

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['+33612345678']);
		expect(wrapper.text()).toContain('+33');
	});

	it('emits null for letters', async () => {
		const wrapper = await mountSuspended(CPhoneNumberInput);

		await wrapper.find('input[type="tel"]').setValue('abc');

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null]);
	});

	it('shows a number passed in through v-model', async () => {
		const wrapper = await mountSuspended(CPhoneNumberInput, { props: { modelValue: '+32470123456' } });

		expect((wrapper.find('input[type="tel"]').element as HTMLInputElement).value).toBe('0470 12 34 56');
	});

	it('names the countries in the active locale', async () => {
		// useCountryOptions uses useI18n, so it has to run inside a component's setup
		let germany = (): string | undefined => undefined;
		const Probe = defineComponent({
			setup() {
				const { countries } = useCountryOptions();
				germany = () => countries.value.find((country) => country.id === 'DE')?.label;
				return () => null;
			}
		});
		await mountSuspended(Probe);

		expect(germany()).toBe('Duitsland');
	});
});

import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';

import { CPriceInput } from '#components';

describe('CPriceInput', () => {
	it('shows cents as euros', async () => {
		const wrapper = await mountSuspended(CPriceInput, { props: { modelValue: 1_017_600 } });

		expect((wrapper.find('input').element as HTMLInputElement).value.replace(/\s/g, ' ')).toBe('€ 10.176,00');
	});
});

import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';

import { CLogo } from '#components';

describe('CLogo', () => {
	it('links to the home page of the current locale', async () => {
		const wrapper = await mountSuspended(CLogo);
		const link = wrapper.find('a');

		expect(link.attributes('aria-label')).toBe('Who Owns The Zebra');
		expect(link.attributes('href')).toBe('/nl');
	});
});

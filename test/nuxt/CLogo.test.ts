import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';

import { CLogo } from '#components';

describe('CLogo', () => {
	it('links to the overview with the project name', async () => {
		const wrapper = await mountSuspended(CLogo, { props: { name: 'Leopoldlaan 12' } });
		const link = wrapper.find('a');

		expect(link.attributes('href')).toBe('/');
		expect(wrapper.text()).toContain('Leopoldlaan 12');
	});

	it('shows only the icon when the sidebar is collapsed', async () => {
		const wrapper = await mountSuspended(CLogo, { props: { iconOnly: true } });

		expect(wrapper.text()).toBe('');
	});
});

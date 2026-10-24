import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { CGantt, UApp } from '#components';

// Tooltips need the provider UApp sets up, like in the real layout.
function mountGantt(props: { tasks: TaskView[]; phases: PhaseView[]; dayWidth: number }) {
	return mountSuspended(defineComponent({ setup: () => () => h(UApp, null, () => h(CGantt, props)) }));
}

registerEndpoint('/api/lookups', () => ({
	rooms: [],
	categories: [{ id: 'elec', name: 'Elektriciteit', color: 'amber', icon: 'i-lucide-zap', sortOrder: 0 }],
	phases: [],
	contacts: [],
	users: []
}));

function task(overrides: Partial<TaskView>): TaskView {
	return {
		id: 't',
		title: 'Taak',
		description: null,
		status: 'todo',
		priority: 'normal',
		roomId: null,
		categoryId: null,
		phaseId: null,
		assigneeUserId: null,
		assigneeContactId: null,
		startDate: null,
		dueDate: null,
		doneAt: null,
		sortOrder: 0,
		dependsOn: [],
		commentCount: 0,
		attachmentCount: 0,
		createdAt: '2026-10-01T00:00:00.000Z',
		...overrides
	};
}

const phases: PhaseView[] = [
	{ id: 'tech', name: 'Technieken', startDate: '2026-11-02', endDate: '2026-11-29', isMilestone: false, sortOrder: 0 },
	{ id: 'keuring', name: 'Keuring', startDate: '2026-11-30', endDate: '2026-11-30', isMilestone: true, sortOrder: 1 }
];

describe('CGantt', () => {
	it('draws one bar per dated task, grouped under its phase, sized by duration', async () => {
		const wrapper = await mountGantt({
			dayWidth: 10,
			phases,
			tasks: [
				task({
					id: 'a',
					title: 'Kabels trekken',
					phaseId: 'tech',
					categoryId: 'elec',
					startDate: '2026-11-02',
					dueDate: '2026-11-06'
				}),
				task({ id: 'b', title: 'Zonder datum' })
			]
		});

		expect(wrapper.text()).toContain('Technieken');
		expect(wrapper.text()).toContain('Kabels trekken');
		expect(wrapper.text()).not.toContain('Zonder datum');

		const bar = wrapper.find('button[aria-label^="Kabels trekken"]');
		expect(bar.attributes('style')).toContain('width: 50px');
		expect(wrapper.find('[aria-label="Keuring"]').exists()).toBe(true);
	});

	it('outlines a task that starts before the task it waits for', async () => {
		const wrapper = await mountGantt({
			dayWidth: 10,
			phases: [],
			tasks: [
				task({ id: 'a', title: 'Elektriciteit', startDate: '2026-11-02', dueDate: '2026-11-10' }),
				task({ id: 'b', title: 'Pleisteren', startDate: '2026-11-05', dueDate: '2026-11-12', dependsOn: ['a'] })
			]
		});

		expect(wrapper.find('button[aria-label^="Pleisteren"]').classes()).toContain('ring-error');
		expect(wrapper.find('button[aria-label^="Elektriciteit"]').classes()).not.toContain('ring-error');
	});
});

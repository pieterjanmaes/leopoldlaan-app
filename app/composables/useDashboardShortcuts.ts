import { createSharedComposable } from '@vueuse/core';

const _useDashboardShortcuts = () => {
	const router = useRouter();

	defineShortcuts(
		Object.fromEntries(
			[...PRIMARY_NAV, ...SECONDARY_NAV]
				.filter((entry) => entry.shortcut)
				.map((entry) => [entry.shortcut, () => router.push(entry.to)])
		)
	);
};

export const useDashboardShortcuts = createSharedComposable(_useDashboardShortcuts);

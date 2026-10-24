export interface NavEntry {
	label: string;
	icon: string;
	to: string;
	/** Shown to externals too. */
	external?: boolean;
	shortcut?: string;
}

export const PRIMARY_NAV: NavEntry[] = [
	{ label: 'Overzicht', icon: 'i-lucide-layout-dashboard', to: '/', external: true, shortcut: 'g-o' },
	{ label: 'Taken', icon: 'i-lucide-list-checks', to: '/taken', external: true, shortcut: 'g-t' },
	{ label: 'Planning', icon: 'i-lucide-calendar-range', to: '/planning', shortcut: 'g-p' },
	{ label: 'Grondplan', icon: 'i-lucide-map', to: '/grondplan', shortcut: 'g-g' },
	{ label: 'Budget', icon: 'i-lucide-wallet', to: '/budget', shortcut: 'g-b' },
	{ label: 'Bestanden', icon: 'i-lucide-folder-open', to: '/bestanden', shortcut: 'g-f' }
];

export const SECONDARY_NAV: NavEntry[] = [
	{ label: 'Contacten', icon: 'i-lucide-contact', to: '/contacten', shortcut: 'g-c' },
	{ label: 'Instellingen', icon: 'i-lucide-settings', to: '/instellingen', shortcut: 'g-i' }
];

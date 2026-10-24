export interface NavEntry {
	label: string;
	icon: string;
	to: string;
	/** Shown to externals too. */
	external?: boolean;
	/** In the phone's bottom bar; the rest is behind the menu button. */
	mobile?: boolean;
	shortcut?: string;
}

export const PRIMARY_NAV: NavEntry[] = [
	{ label: 'Overzicht', icon: 'i-lucide-layout-dashboard', to: '/', external: true, mobile: true, shortcut: 'g-o' },
	{ label: 'Taken', icon: 'i-lucide-list-checks', to: '/taken', external: true, mobile: true, shortcut: 'g-t' },
	{ label: 'Aankopen', icon: 'i-lucide-shopping-cart', to: '/aankopen', mobile: true, shortcut: 'g-a' },
	{ label: 'Beslissingen', icon: 'i-lucide-scale', to: '/beslissingen', mobile: true, shortcut: 'g-d' },
	{ label: 'Planning', icon: 'i-lucide-calendar-range', to: '/planning', shortcut: 'g-p' },
	{ label: 'Grondplan', icon: 'i-lucide-map', to: '/grondplan', shortcut: 'g-g' },
	{ label: 'Budget', icon: 'i-lucide-wallet', to: '/budget', mobile: true, shortcut: 'g-b' },
	{ label: 'Bestanden', icon: 'i-lucide-folder-open', to: '/bestanden', shortcut: 'g-f' }
];

export const SECONDARY_NAV: NavEntry[] = [
	{ label: 'Contacten', icon: 'i-lucide-contact', to: '/contacten', shortcut: 'g-c' },
	{ label: 'Instellingen', icon: 'i-lucide-settings', to: '/instellingen', shortcut: 'g-i' }
];

export const USER_ROLES = ['owner', 'member', 'external'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
	owner: 'Eigenaar',
	member: 'Huisgenoot',
	external: 'Extern'
};

export const TASK_STATUSES = ['todo', 'in_progress', 'waiting', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_META: Record<TaskStatus, { label: string; icon: string; color: BadgeColor }> = {
	todo: { label: 'Te doen', icon: 'i-lucide-circle', color: 'neutral' },
	in_progress: { label: 'Bezig', icon: 'i-lucide-circle-dot', color: 'info' },
	waiting: { label: 'Wacht', icon: 'i-lucide-circle-pause', color: 'warning' },
	done: { label: 'Klaar', icon: 'i-lucide-circle-check', color: 'success' }
};

export const TASK_PRIORITIES = ['low', 'normal', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_META: Record<TaskPriority, { label: string; color: BadgeColor }> = {
	low: { label: 'Laag', color: 'neutral' },
	normal: { label: 'Normaal', color: 'info' },
	high: { label: 'Hoog', color: 'error' }
};

export const QUOTE_STATUSES = ['requested', 'received', 'approved', 'rejected'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; color: BadgeColor }> = {
	requested: { label: 'Aangevraagd', color: 'neutral' },
	received: { label: 'Ontvangen', color: 'info' },
	approved: { label: 'Goedgekeurd', color: 'success' },
	rejected: { label: 'Afgewezen', color: 'error' }
};

export const SUBSIDY_STATUSES = ['planned', 'applied', 'granted', 'paid', 'rejected'] as const;
export type SubsidyStatus = (typeof SUBSIDY_STATUSES)[number];

export const SUBSIDY_STATUS_META: Record<SubsidyStatus, { label: string; color: BadgeColor }> = {
	planned: { label: 'Gepland', color: 'neutral' },
	applied: { label: 'Aangevraagd', color: 'info' },
	granted: { label: 'Toegekend', color: 'primary' },
	paid: { label: 'Uitbetaald', color: 'success' },
	rejected: { label: 'Geweigerd', color: 'error' }
};

/** Belgian VAT rates; 6% applies to renovation of homes older than 10 years. */
export const VAT_RATES = [0, 6, 12, 21] as const;
export type VatRate = (typeof VAT_RATES)[number];
export const DEFAULT_VAT_RATE: VatRate = 6;

export const PAYMENT_METHODS = ['transfer', 'card', 'cash', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
	transfer: 'Overschrijving',
	card: 'Kaart',
	cash: 'Cash',
	other: 'Andere'
};

/** Open: still to choose. Decided: settled. Replaced: overruled by a later decision, kept for the history. */
export const DECISION_STATUSES = ['open', 'decided', 'replaced'] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const DECISION_STATUS_META: Record<DecisionStatus, { label: string; icon: string; color: BadgeColor }> = {
	open: { label: 'Te beslissen', icon: 'i-lucide-circle-help', color: 'warning' },
	decided: { label: 'Beslist', icon: 'i-lucide-circle-check-big', color: 'success' },
	replaced: { label: 'Vervangen', icon: 'i-lucide-history', color: 'neutral' }
};

export const MATERIAL_STATUSES = ['needed', 'ordered', 'delivered'] as const;
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

export const MATERIAL_STATUS_META: Record<MaterialStatus, { label: string; icon: string; color: BadgeColor }> = {
	needed: { label: 'Te kopen', icon: 'i-lucide-shopping-cart', color: 'warning' },
	ordered: { label: 'Besteld', icon: 'i-lucide-truck', color: 'info' },
	delivered: { label: 'Geleverd', icon: 'i-lucide-package-check', color: 'success' }
};

export const MATERIAL_UNITS = ['st', 'm²', 'm', 'm³', 'l', 'kg', 'doos', 'rol', 'zak', 'pak', 'set'] as const;
export type MaterialUnit = (typeof MATERIAL_UNITS)[number];

/** Store-bought materials carry 21% VAT; the 6% renovation rate only applies when a contractor supplies and installs. */
export const MATERIAL_VAT_RATE = 21;

/** Warn this many days before a material is needed on site while it hasn't been ordered yet. */
export const ORDER_WARNING_DAYS = 14;

export const PLAN_MARKER_KINDS = ['zone', 'pin'] as const;
export type PlanMarkerKind = (typeof PLAN_MARKER_KINDS)[number];

/** Things a Drive file can be attached to. */
export const ATTACHMENT_ENTITIES = ['task', 'quote', 'expense', 'room', 'contact', 'subsidy', 'decision'] as const;
export type AttachmentEntity = (typeof ATTACHMENT_ENTITIES)[number];

export const CATEGORY_COLORS = [
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'violet',
	'purple',
	'fuchsia',
	'pink',
	'rose',
	'stone'
] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';

export const DEFAULT_CONTINGENCY_PERCENT = 10;

export const INVITE_TTL_DAYS = 14;
export const DAY_MS = 24 * 60 * 60 * 1000;

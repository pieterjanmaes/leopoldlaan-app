import { MATERIAL_UNITS, ORDER_WARNING_DAYS, type MaterialUnit } from './constants';
import { addDays } from './dates';

export function materialTotalCents(quantity: number, unitPriceCents: number | null | undefined): number | null {
	if (unitPriceCents === null || unitPriceCents === undefined) {
		return null;
	}

	return Math.round(quantity * unitPriceCents);
}

/** Needs ordering: not ordered yet and needed on site within the warning window (or already late). */
export function needsOrdering(
	material: { status: string; effectiveNeededBy: string | null; expenseId?: string | null },
	today: string,
	warningDays = ORDER_WARNING_DAYS
): boolean {
	return (
		material.status === 'needed' &&
		!material.expenseId &&
		material.effectiveNeededBy !== null &&
		material.effectiveNeededBy <= addDays(today, warningDays)
	);
}

const UNIT_ALIASES: Record<string, MaterialUnit> = {
	stuk: 'st',
	stuks: 'st',
	x: 'st',
	m2: 'm²',
	vierkante: 'm²',
	meter: 'm',
	m3: 'm³',
	liter: 'l',
	dozen: 'doos',
	rollen: 'rol',
	zakken: 'zak',
	pakken: 'pak',
	sets: 'set'
};

/**
 * Turns "12 m² vloertegels", "3 zakken lijm" or "stopcontacten" into a quantity, unit and name, so the quick-add
 * field on the shopping list understands how people actually type a list.
 */
export function parseQuickMaterial(input: string): { name: string; quantity: number; unit: MaterialUnit } {
	const text = input.trim().replace(/\s+/g, ' ');
	const match =
		text.match(/^(\d+(?:[.,]\d+)?)\s*([^\s\d]\S*)?\s+(.+)$/) ?? text.match(/^(\d+(?:[.,]\d+)?)([a-z²³]+)\s+(.+)$/i);
	if (!match) {
		return { name: text, quantity: 1, unit: 'st' };
	}

	const quantity = Number(match[1]?.replace(',', '.'));
	const unitWord = match[2]?.toLowerCase();
	const rest = match[3] ?? '';
	const unit = unitWord
		? (MATERIAL_UNITS as readonly string[]).includes(unitWord)
			? (unitWord as MaterialUnit)
			: UNIT_ALIASES[unitWord]
		: undefined;

	if (unit) {
		return { name: rest, quantity, unit };
	}

	// "4 stopcontacten": the second word belongs to the name.
	return { name: unitWord ? `${match[2]} ${rest}` : rest, quantity, unit: 'st' };
}

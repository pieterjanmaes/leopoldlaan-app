import { materialStamps } from '@@/server/utils/materials';
import { summarizeBudget } from '@@/shared/utils/budget';
import { materialTotalCents, needsOrdering, parseQuickMaterial } from '@@/shared/utils/materials';
import { describe, expect, it } from 'vitest';

describe('parseQuickMaterial', () => {
	it.each([
		['12 m² vloertegels', { quantity: 12, unit: 'm²', name: 'vloertegels' }],
		['12 m2 vloertegels', { quantity: 12, unit: 'm²', name: 'vloertegels' }],
		['3 zakken tegellijm', { quantity: 3, unit: 'zak', name: 'tegellijm' }],
		['2,5 l primer', { quantity: 2.5, unit: 'l', name: 'primer' }],
		['4 stopcontacten', { quantity: 4, unit: 'st', name: 'stopcontacten' }],
		['4 dubbele stopcontacten', { quantity: 4, unit: 'st', name: 'dubbele stopcontacten' }],
		['10m kabel', { quantity: 10, unit: 'm', name: 'kabel' }],
		['silicone transparant', { quantity: 1, unit: 'st', name: 'silicone transparant' }]
	])('reads "%s"', (input, expected) => {
		expect(parseQuickMaterial(input)).toEqual(expected);
	});
});

describe('materialTotalCents', () => {
	it('multiplies and rounds to a cent', () => {
		expect(materialTotalCents(12.5, 2_995)).toBe(37_438);
		expect(materialTotalCents(3, null)).toBeNull();
	});
});

describe('needsOrdering', () => {
	const today = '2026-10-24';

	it('warns for items needed soon or already late that are not ordered', () => {
		expect(needsOrdering({ status: 'needed', effectiveNeededBy: '2026-11-01' }, today)).toBe(true);
		expect(needsOrdering({ status: 'needed', effectiveNeededBy: '2026-10-01' }, today)).toBe(true);
	});

	it('stays quiet when far off, undated or already ordered', () => {
		expect(needsOrdering({ status: 'needed', effectiveNeededBy: '2027-01-01' }, today)).toBe(false);
		expect(needsOrdering({ status: 'needed', effectiveNeededBy: null }, today)).toBe(false);
		expect(needsOrdering({ status: 'ordered', effectiveNeededBy: '2026-10-25' }, today)).toBe(false);
	});
});

describe('materialStamps', () => {
	const fresh = { status: 'needed' as const, orderedOn: null, deliveredOn: null };

	it('fills in the dates when moving along', () => {
		expect(materialStamps({ status: 'ordered' }, fresh).orderedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		const delivered = materialStamps({ status: 'delivered' }, { ...fresh, status: 'ordered', orderedOn: '2026-10-01' });
		expect(delivered.orderedOn).toBe('2026-10-01');
		expect(delivered.deliveredOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('clears dates that no longer apply when moving back', () => {
		expect(
			materialStamps({ status: 'needed' }, { status: 'delivered', orderedOn: '2026-10-01', deliveredOn: '2026-10-05' })
		).toEqual({
			orderedOn: null,
			deliveredOn: null
		});
	});
});

describe('purchases in the budget', () => {
	it('count as expected cost until they are on an invoice', () => {
		const [roof] = summarizeBudget(
			[{ categoryId: 'tiles', plannedCents: 100_000 }],
			[],
			[{ categoryId: 'tiles', quoteId: null, amountInclCents: 30_000, paidOn: null }],
			[
				{ categoryId: 'tiles', totalCents: 90_000, expenseId: null },
				{ categoryId: 'tiles', totalCents: 30_000, expenseId: 'e1' },
				{ categoryId: 'tiles', totalCents: null, expenseId: null }
			]
		);

		expect(roof).toMatchObject({ purchasesCents: 90_000, invoicedCents: 30_000, forecastCents: 120_000 });
	});
});

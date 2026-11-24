import { budgetTotals, summarizeBudget } from '@@/shared/utils/budget';
import { describe, expect, it } from 'vitest';

const ROOF = 'roof';
const KITCHEN = 'kitchen';

describe('summarizeBudget', () => {
	it('falls back to the plan while nothing is quoted', () => {
		const [kitchen] = summarizeBudget([{ categoryId: KITCHEN, plannedCents: 1_800_000 }], [], []);

		expect(kitchen?.forecastCents).toBe(1_800_000);
	});

	it('does not count an invoice twice against its approved quote', () => {
		const [roof] = summarizeBudget(
			[{ categoryId: ROOF, plannedCents: 3_000_000 }],
			[{ categoryId: ROOF, status: 'approved', amountInclCents: 3_392_000 }],
			[{ categoryId: ROOF, quoteId: 'q1', amountInclCents: 1_017_600, paidOn: '2026-10-20' }]
		);

		expect(roof).toMatchObject({
			committedCents: 3_392_000,
			invoicedCents: 1_017_600,
			paidCents: 1_017_600,
			// Quote is above plan, so the quote wins.
			forecastCents: 3_392_000
		});
	});

	it('adds extra invoices without a quote on top', () => {
		const [roof] = summarizeBudget(
			[],
			[{ categoryId: ROOF, status: 'approved', amountInclCents: 1_000_000 }],
			[{ categoryId: ROOF, quoteId: null, amountInclCents: 200_000, paidOn: null }]
		);

		expect(roof?.forecastCents).toBe(1_200_000);
	});

	it('ignores quotes that are not approved', () => {
		const [roof] = summarizeBudget(
			[{ categoryId: ROOF, plannedCents: 500_000 }],
			[{ categoryId: ROOF, status: 'received', amountInclCents: 900_000 }],
			[]
		);

		expect(roof?.forecastCents).toBe(500_000);
	});
});

describe('budgetTotals', () => {
	it('adds contingency and subtracts subsidies that are still expected', () => {
		const categories = summarizeBudget([{ categoryId: ROOF, plannedCents: 1_000_000 }], [], []);
		const totals = budgetTotals(categories, 10, [
			{ expectedCents: 150_000, receivedCents: 0, status: 'applied' },
			{ expectedCents: 999_999, receivedCents: 0, status: 'rejected' }
		]);

		expect(totals).toMatchObject({
			plannedCents: 1_000_000,
			contingencyCents: 100_000,
			subsidiesExpectedCents: 150_000,
			netForecastCents: 950_000
		});
	});
});

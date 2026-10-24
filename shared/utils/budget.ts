import type { QuoteStatus, SubsidyStatus } from './constants';

export interface BudgetInput {
	categoryId: string | null;
	plannedCents: number;
}

export interface QuoteInput {
	categoryId: string | null;
	status: QuoteStatus;
	amountInclCents: number;
}

export interface ExpenseInput {
	categoryId: string | null;
	quoteId: string | null;
	amountInclCents: number;
	paidOn: string | null;
}

export interface PurchaseInput {
	categoryId: string | null;
	totalCents: number | null;
	/** Purchases already booked on an invoice are counted there instead. */
	expenseId: string | null;
}

export interface CategoryBudget {
	categoryId: string | null;
	plannedCents: number;
	/** Sum of approved quotes. */
	committedCents: number;
	/** Sum of all invoices, paid or not. */
	invoicedCents: number;
	paidCents: number;
	/** Shopping-list items with a price that aren't on an invoice yet. */
	purchasesCents: number;
	/** Best estimate of what this category will finally cost. */
	forecastCents: number;
}

function bucket(map: Map<string | null, CategoryBudget>, categoryId: string | null): CategoryBudget {
	let entry = map.get(categoryId);
	if (!entry) {
		entry = {
			categoryId,
			plannedCents: 0,
			committedCents: 0,
			invoicedCents: 0,
			paidCents: 0,
			purchasesCents: 0,
			forecastCents: 0
		};
		map.set(categoryId, entry);
	}

	return entry;
}

/**
 * Forecast per category: invoices already received, plus the part of approved quotes not invoiced yet, plus
 * shopping-list items not invoiced yet — or the plan, when that is higher. Invoices tied to a quote count against
 * that quote; purchases booked on an invoice count as that invoice.
 */
export function summarizeBudget(
	lines: BudgetInput[],
	quotes: QuoteInput[],
	expenses: ExpenseInput[],
	purchases: PurchaseInput[] = []
): CategoryBudget[] {
	const map = new Map<string | null, CategoryBudget>();

	for (const line of lines) {
		bucket(map, line.categoryId).plannedCents += line.plannedCents;
	}
	for (const quote of quotes) {
		if (quote.status === 'approved') {
			bucket(map, quote.categoryId).committedCents += quote.amountInclCents;
		}
	}

	const invoicedAgainstQuotes = new Map<string | null, number>();
	for (const expense of expenses) {
		const entry = bucket(map, expense.categoryId);
		entry.invoicedCents += expense.amountInclCents;
		if (expense.paidOn) {
			entry.paidCents += expense.amountInclCents;
		}
		if (expense.quoteId) {
			invoicedAgainstQuotes.set(
				expense.categoryId,
				(invoicedAgainstQuotes.get(expense.categoryId) ?? 0) + expense.amountInclCents
			);
		}
	}

	for (const purchase of purchases) {
		if (!purchase.expenseId && purchase.totalCents) {
			bucket(map, purchase.categoryId).purchasesCents += purchase.totalCents;
		}
	}

	for (const entry of map.values()) {
		const openCommitted = Math.max(entry.committedCents - (invoicedAgainstQuotes.get(entry.categoryId) ?? 0), 0);
		const known = entry.invoicedCents + openCommitted + entry.purchasesCents;
		entry.forecastCents = Math.max(known, entry.plannedCents);
	}

	return [...map.values()];
}

export interface BudgetTotals {
	plannedCents: number;
	committedCents: number;
	invoicedCents: number;
	paidCents: number;
	forecastCents: number;
	contingencyCents: number;
	subsidiesExpectedCents: number;
	subsidiesReceivedCents: number;
	/** Forecast plus contingency minus expected subsidies: what the renovation will cost out of pocket. */
	netForecastCents: number;
}

export function budgetTotals(
	categories: CategoryBudget[],
	contingencyPercent: number,
	subsidies: { expectedCents: number; receivedCents: number; status: SubsidyStatus }[]
): BudgetTotals {
	const sum = (pick: (entry: CategoryBudget) => number) => categories.reduce((total, entry) => total + pick(entry), 0);
	const plannedCents = sum((entry) => entry.plannedCents);
	const forecastCents = sum((entry) => entry.forecastCents);
	const contingencyCents = Math.round((plannedCents * contingencyPercent) / 100);
	const activeSubsidies = subsidies.filter((subsidy) => subsidy.status !== 'rejected');
	const subsidiesExpectedCents = activeSubsidies.reduce(
		(total, subsidy) => total + Math.max(subsidy.expectedCents, subsidy.receivedCents),
		0
	);

	return {
		plannedCents,
		committedCents: sum((entry) => entry.committedCents),
		invoicedCents: sum((entry) => entry.invoicedCents),
		paidCents: sum((entry) => entry.paidCents),
		forecastCents,
		contingencyCents,
		subsidiesExpectedCents,
		subsidiesReceivedCents: activeSubsidies.reduce((total, subsidy) => total + subsidy.receivedCents, 0),
		netForecastCents: forecastCents + contingencyCents - subsidiesExpectedCents
	};
}

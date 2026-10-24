import { db } from 'hub:db';

import { budgetTotals, summarizeBudget } from '../../shared/utils/budget';
import { inclVatCents } from '../../shared/utils/vat';
import { asc, desc, eq, sql, tables, type Expense, type Quote } from './drizzle';

async function attachmentCounts(entityType: 'quote' | 'expense'): Promise<Map<string, number>> {
	const rows = await db
		.select({ id: tables.attachments.entityId, count: sql<number>`count(*)` })
		.from(tables.attachments)
		.where(eq(tables.attachments.entityType, entityType))
		.groupBy(tables.attachments.entityId);

	return new Map(rows.map((row) => [row.id, row.count]));
}

export function toQuoteView(quote: Quote, attachmentCount = 0): QuoteView {
	return {
		id: quote.id,
		title: quote.title,
		contactId: quote.contactId,
		categoryId: quote.categoryId,
		amountExclCents: quote.amountExclCents,
		vatRate: quote.vatRate,
		amountInclCents: inclVatCents(quote.amountExclCents, quote.vatRate),
		status: quote.status,
		receivedOn: quote.receivedOn,
		validUntil: quote.validUntil,
		notes: quote.notes,
		attachmentCount
	};
}

export function toExpenseView(expense: Expense, attachmentCount = 0): ExpenseView {
	return {
		id: expense.id,
		description: expense.description,
		contactId: expense.contactId,
		quoteId: expense.quoteId,
		categoryId: expense.categoryId,
		roomId: expense.roomId,
		amountExclCents: expense.amountExclCents,
		vatRate: expense.vatRate,
		amountInclCents: expense.amountInclCents,
		invoiceNumber: expense.invoiceNumber,
		invoiceDate: expense.invoiceDate,
		dueDate: expense.dueDate,
		paidOn: expense.paidOn,
		paymentMethod: expense.paymentMethod,
		notes: expense.notes,
		attachmentCount
	};
}

export async function getBudgetOverview(): Promise<BudgetOverview> {
	const [project, lines, quoteRows, expenseRows, subsidies, quoteFiles, expenseFiles] = await Promise.all([
		getProject(),
		db.select().from(tables.budgetLines).orderBy(asc(tables.budgetLines.label)),
		db.select().from(tables.quotes).orderBy(desc(tables.quotes.createdAt)),
		db
			.select()
			.from(tables.expenses)
			.orderBy(desc(sql`coalesce(${tables.expenses.invoiceDate}, ${tables.expenses.createdAt})`)),
		db.select().from(tables.subsidies).orderBy(asc(tables.subsidies.name)),
		attachmentCounts('quote'),
		attachmentCounts('expense')
	]);

	const quotes = quoteRows.map((quote) => toQuoteView(quote, quoteFiles.get(quote.id) ?? 0));
	const expenses = expenseRows.map((expense) => toExpenseView(expense, expenseFiles.get(expense.id) ?? 0));
	const categories = summarizeBudget(lines, quotes, expenses);

	return {
		lines,
		quotes,
		expenses,
		subsidies,
		categories,
		totals: budgetTotals(categories, project.contingencyPercent, subsidies),
		contingencyPercent: project.contingencyPercent
	};
}

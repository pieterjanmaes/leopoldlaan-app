import { db } from 'hub:db';

import { expenseSchema } from '../../../shared/schemas/budget';
import { idParams } from '../../../shared/schemas/common';
import { inclVatCents } from '../../../shared/utils/vat';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<ExpenseView> => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const body = await readValidatedBody(event, (body) => expenseSchema.partial().parse(body));

	const current = await db.select().from(tables.expenses).where(eq(tables.expenses.id, id)).get();
	if (!current) {
		throw createError({ statusCode: 404, message: 'Uitgave niet gevonden' });
	}

	// A changed amount or rate recomputes the total, unless the invoice's own total was sent along.
	const amountChanged = body.amountExclCents !== undefined || body.vatRate !== undefined;
	const amountInclCents =
		body.amountInclCents ??
		(amountChanged
			? inclVatCents(body.amountExclCents ?? current.amountExclCents, body.vatRate ?? current.vatRate)
			: undefined);

	const expense = await db
		.update(tables.expenses)
		.set({ ...body, amountInclCents })
		.where(eq(tables.expenses.id, id))
		.returning()
		.get();

	return toExpenseView(expense ?? current);
});

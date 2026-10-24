import { db } from 'hub:db';

import { expenseSchema } from '../../../shared/schemas/budget';
import { inclVatCents } from '../../../shared/utils/vat';
import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<ExpenseView> => {
	await requireInternal(event);
	const body = await readValidatedBody(event, (body) => expenseSchema.parse(body));

	const expense = await db
		.insert(tables.expenses)
		.values({ ...body, amountInclCents: body.amountInclCents ?? inclVatCents(body.amountExclCents, body.vatRate) })
		.returning()
		.get();

	return toExpenseView(expense);
});

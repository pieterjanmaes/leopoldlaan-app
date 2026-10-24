import { db } from 'hub:db';

import { budgetLineSchema } from '../../../shared/schemas/budget';
import { idParams } from '../../../shared/schemas/common';
import { tables, eq } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const body = await readValidatedBody(event, (body) => budgetLineSchema.partial().parse(body));

	const row = await db.update(tables.budgetLines).set(body).where(eq(tables.budgetLines.id, id)).returning().get();
	if (!row) {
		throw createError({ statusCode: 404, message: 'Budgetpost niet gevonden' });
	}

	return row;
});

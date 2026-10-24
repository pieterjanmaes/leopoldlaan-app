import { db } from 'hub:db';

import { budgetLineSchema } from '../../../shared/schemas/budget';
import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const body = await readValidatedBody(event, (body) => budgetLineSchema.parse(body));

	return await db.insert(tables.budgetLines).values(body).returning().get();
});

import { db } from 'hub:db';

import { subsidySchema } from '../../../shared/schemas/budget';
import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const body = await readValidatedBody(event, (body) => subsidySchema.parse(body));

	return await db.insert(tables.subsidies).values(body).returning().get();
});

import { db } from 'hub:db';

import { phaseSchema } from '../../../shared/schemas/catalog';
import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const body = await readValidatedBody(event, (body) => phaseSchema.parse(body));

	return await db.insert(tables.phases).values(body).returning().get();
});

import { db } from 'hub:db';

import { categorySchema } from '../../../shared/schemas/catalog';
import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const body = await readValidatedBody(event, (body) => categorySchema.parse(body));

	return await db.insert(tables.categories).values(body).returning().get();
});

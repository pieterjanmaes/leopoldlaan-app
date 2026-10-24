import { db } from 'hub:db';

import { roomSchema } from '../../../shared/schemas/catalog';
import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const body = await readValidatedBody(event, (body) => roomSchema.parse(body));

	return await db.insert(tables.rooms).values(body).returning().get();
});

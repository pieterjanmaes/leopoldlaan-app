import { db } from 'hub:db';

import { contactSchema } from '../../../shared/schemas/catalog';
import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const body = await readValidatedBody(event, (body) => contactSchema.parse(body));

	return await db.insert(tables.contacts).values(body).returning().get();
});

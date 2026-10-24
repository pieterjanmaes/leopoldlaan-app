import { desc } from 'drizzle-orm';
import { db } from 'hub:db';

import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireUserSession(event);
	return await db.select().from(tables.formSubmissions).orderBy(desc(tables.formSubmissions.createdAt)).all();
});

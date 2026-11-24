import { db } from 'hub:db';

import { asc, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<UserView[]> => {
	await requireOwner(event);

	const users = await db.select().from(tables.users).orderBy(asc(tables.users.name));

	return users.map(toUserView);
});

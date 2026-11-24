import { db } from 'hub:db';

import { desc, isNull, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<InviteView[]> => {
	await requireOwner(event);

	const invites = await db
		.select()
		.from(tables.invites)
		.where(isNull(tables.invites.usedAt))
		.orderBy(desc(tables.invites.createdAt));

	return invites.map((invite) => toInviteView(invite));
});

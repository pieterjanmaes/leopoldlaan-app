import { db } from 'hub:db';

import { inviteSchema } from '../../../shared/schemas/users';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<InviteView> => {
	const owner = await requireOwner(event);
	const body = await readValidatedBody(event, (body) => inviteSchema.parse(body));

	const existing = await db.select().from(tables.users).where(eq(tables.users.email, body.email.toLowerCase())).get();
	if (existing) {
		throw createError({ statusCode: 400, message: 'Er bestaat al een account met dit e-mailadres' });
	}

	return await createInvite(event, owner.id, body);
});

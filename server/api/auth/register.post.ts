import { createId } from '@paralleldrive/cuid2';
import { db } from 'hub:db';

import { registerSchema } from '../../../shared/schemas/auth';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, (body) => registerSchema.parse(body));
	const invite = await findValidInvite(body.invite);

	const existing = await db.select().from(tables.users).where(eq(tables.users.email, invite.email)).get();
	if (existing) {
		throw createError({ statusCode: 400, message: 'Er bestaat al een account met dit e-mailadres' });
	}

	const userId = createId();
	await db.insert(tables.users).values({
		id: userId,
		email: invite.email,
		name: body.name,
		password: await hashPassword(body.password),
		role: invite.role,
		contactId: invite.contactId
	});
	await consumeInvite(invite.id, userId);

	// Two tabs racing on one link: only the one that marked the invite keeps its account.
	const claimed = await db.select().from(tables.invites).where(eq(tables.invites.id, invite.id)).get();
	if (claimed?.usedBy !== userId) {
		await db.delete(tables.users).where(eq(tables.users.id, userId));
		throw createError({ statusCode: 410, message: 'Deze uitnodiging is ongeldig of al gebruikt' });
	}

	const user = toSessionUser({
		id: userId,
		email: invite.email,
		name: body.name,
		role: invite.role,
		contactId: invite.contactId
	});
	await startUserSession(event, user);

	return user;
});

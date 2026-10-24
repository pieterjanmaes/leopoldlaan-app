import { db } from 'hub:db';
import * as z from 'zod';

import { eq, tables } from '../../utils/drizzle';

const querySchema = z.object({ token: z.string().min(1) });

/** Public: lets the register page greet the invitee. */
export default defineEventHandler(async (event): Promise<InviteLookup> => {
	const { token } = await getValidatedQuery(event, (query) => querySchema.parse(query));
	const invite = await findValidInvite(token);
	const inviter = invite.createdBy
		? await db.select({ name: tables.users.name }).from(tables.users).where(eq(tables.users.id, invite.createdBy)).get()
		: undefined;

	return { email: invite.email, name: invite.name, inviterName: inviter?.name ?? null };
});

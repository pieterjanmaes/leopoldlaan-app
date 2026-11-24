import { db } from 'hub:db';

import { passwordChangeSchema } from '../../../shared/schemas/users';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const body = await readValidatedBody(event, (body) => passwordChangeSchema.parse(body));

	await findUserByCredentials(user.email, body.currentPassword);
	await db
		.update(tables.users)
		.set({ password: await hashPassword(body.newPassword), passwordChangedAt: new Date(Date.now() - 1000) })
		.where(eq(tables.users.id, user.id));
	// Other devices are logged out by passwordChangedAt; this one gets a fresh session.
	await startUserSession(event, user);

	return { success: true };
});

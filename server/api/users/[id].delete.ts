import { db } from 'hub:db';
import { z } from 'zod';

import { tables, eq } from '../../utils/drizzle';

const paramsSchema = z.object({
	id: z.string()
});

export default defineEventHandler(async (event) => {
	// Only superadmin can delete users
	const session = await requireUserSession(event);
	if (session.user.role !== 'superadmin') {
		throw createError({
			statusCode: 403,
			message: 'Only superadmin can delete users'
		});
	}

	const params = await getValidatedRouterParams(event, (params) => paramsSchema.parse(params));

	// Prevent deleting yourself
	if (params.id === session.user.id) {
		throw createError({
			statusCode: 400,
			message: 'Cannot delete your own account'
		});
	}

	const user = await db.select().from(tables.users).where(eq(tables.users.id, params.id)).get();

	if (!user) {
		throw createError({
			statusCode: 404,
			message: 'User not found'
		});
	}

	await db.delete(tables.users).where(eq(tables.users.id, params.id));

	return {
		success: true
	};
});

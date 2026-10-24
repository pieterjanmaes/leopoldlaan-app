import { desc } from 'drizzle-orm';
import { db } from 'hub:db';

import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	// Only superadmin can list users
	const session = await requireUserSession(event);
	if (session.user.role !== 'superadmin') {
		throw createError({
			statusCode: 403,
			message: 'Only superadmin can view users'
		});
	}

	return await db
		.select({
			id: tables.users.id,
			email: tables.users.email,
			name: tables.users.name,
			role: tables.users.role,
			createdAt: tables.users.createdAt
		})
		.from(tables.users)
		.orderBy(desc(tables.users.createdAt));
});

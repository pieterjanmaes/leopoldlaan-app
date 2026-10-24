import { db } from 'hub:db';
import { z } from 'zod';

import { tables, eq } from '../../utils/drizzle';

const paramsSchema = z.object({
	id: z.string()
});

function generatePassword(length = 12): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
	let password = '';
	for (let i = 0; i < length; i++) {
		password += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return password;
}

export default defineEventHandler(async (event) => {
	const session = await requireUserSession(event);

	if (session.user.role !== 'superadmin') {
		throw createError({
			statusCode: 403,
			message: 'Only superadmins can reset passwords'
		});
	}

	const params = await getValidatedRouterParams(event, (params) => paramsSchema.parse(params));

	const existingUser = await db.select().from(tables.users).where(eq(tables.users.id, params.id)).get();

	if (!existingUser) {
		throw createError({
			statusCode: 404,
			message: 'User not found'
		});
	}

	// Generate new password
	const newPassword = generatePassword(12);
	const hashedPassword = await hashPassword(newPassword);

	// Update user password
	await db.update(tables.users).set({ password: hashedPassword }).where(eq(tables.users.id, params.id));

	return {
		password: newPassword
	};
});

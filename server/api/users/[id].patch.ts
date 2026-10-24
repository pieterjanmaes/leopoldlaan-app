import { db } from 'hub:db';
import { z } from 'zod';

import { tables, eq } from '../../utils/drizzle';

const paramsSchema = z.object({
	id: z.string()
});

const bodySchema = z.object({
	email: z.string().email().optional(),
	name: z.string().optional(),
	password: z.string().min(8).optional(),
	role: z.enum(['admin', 'superadmin']).optional()
});

export default defineEventHandler(async (event) => {
	// Only superadmin can update users
	const session = await requireUserSession(event);
	if (session.user.role !== 'superadmin') {
		throw createError({
			statusCode: 403,
			message: 'Only superadmin can update users'
		});
	}

	const params = await getValidatedRouterParams(event, (params) => paramsSchema.parse(params));
	const body = await readValidatedBody(event, (body) => bodySchema.parse(body));

	const user = await db.select().from(tables.users).where(eq(tables.users.id, params.id)).get();

	if (!user) {
		throw createError({
			statusCode: 404,
			message: 'User not found'
		});
	}

	// Check if email is being changed and if it already exists
	if (body.email && body.email !== user.email) {
		const existingUser = await db.select().from(tables.users).where(eq(tables.users.email, body.email)).get();

		if (existingUser) {
			throw createError({
				statusCode: 400,
				message: 'Email already in use'
			});
		}
	}

	// Build update object
	const updateData: Record<string, unknown> = {};

	if (body.email) updateData.email = body.email;
	if (body.name !== undefined) updateData.name = body.name;
	if (body.role) updateData.role = body.role;
	if (body.password) {
		updateData.password = await hashPassword(body.password);
	}

	if (Object.keys(updateData).length === 0) {
		throw createError({
			statusCode: 400,
			message: 'No fields to update'
		});
	}

	const updatedUser = await db
		.update(tables.users)
		.set(updateData)
		.where(eq(tables.users.id, params.id))
		.returning()
		.get();

	return {
		success: true,
		user: {
			id: updatedUser.id,
			email: updatedUser.email,
			name: updatedUser.name,
			role: updatedUser.role
		}
	};
});

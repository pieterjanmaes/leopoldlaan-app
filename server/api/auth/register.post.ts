import { eq } from 'drizzle-orm';
import { db } from 'hub:db';
import { z } from 'zod';

import { tables } from '../../utils/drizzle';

const schema = z.object({
	email: z.email(),
	password: z.string().min(8),
	name: z.string().optional(),
	role: z.enum(['admin', 'superadmin']).default('admin')
});

export default defineEventHandler(async (event) => {
	// Only superadmin can create users
	const session = await requireUserSession(event);
	if (session.user.role !== 'superadmin') {
		throw createError({
			statusCode: 403,
			message: 'Only superadmin can create users'
		});
	}

	const body = await readValidatedBody(event, (body) => schema.parse(body));

	// Check if user already exists
	const existingUser = await db.select().from(tables.users).where(eq(tables.users.email, body.email)).get();

	if (existingUser) {
		throw createError({
			statusCode: 400,
			message: 'User already exists'
		});
	}

	const hashedPassword = await hashPassword(body.password);

	const user = await db
		.insert(tables.users)
		.values({
			email: body.email,
			password: hashedPassword,
			name: body.name,
			role: body.role
		})
		.returning()
		.get();

	return {
		success: true,
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role
		}
	};
});

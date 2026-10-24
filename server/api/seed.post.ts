import { db } from 'hub:db';

import { tables, eq } from '../utils/drizzle';

// Configuration - change these values before running
const SUPERADMIN_EMAIL = 'pieterjan@wotz.be';
const SUPERADMIN_PASSWORD = 'changeme123';
const SUPERADMIN_NAME = 'Super Admin';

export default defineEventHandler(async (event) => {
	// Only allow in development or with a secret key
	const isDev = process.env.NODE_ENV === 'development';
	const seedKey = getHeader(event, 'x-seed-key');
	const expectedKey = process.env.SEED_KEY;

	if (!isDev && seedKey !== expectedKey) {
		throw createError({
			statusCode: 403,
			message: 'Seeding is not allowed'
		});
	}

	// Check if superadmin already exists
	const existingUser = await db.select().from(tables.users).where(eq(tables.users.email, SUPERADMIN_EMAIL)).get();

	if (existingUser) {
		return {
			success: false,
			message: `User ${SUPERADMIN_EMAIL} already exists`
		};
	}

	const hashedPassword = await hashPassword(SUPERADMIN_PASSWORD);

	const user = await db
		.insert(tables.users)
		.values({
			email: SUPERADMIN_EMAIL,
			password: hashedPassword,
			name: SUPERADMIN_NAME,
			role: 'superadmin'
		})
		.returning()
		.get();

	return {
		success: true,
		message: `Superadmin user created: ${user.email}`
	};
});

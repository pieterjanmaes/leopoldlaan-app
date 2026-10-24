import { eq } from 'drizzle-orm';
import type { drizzle } from 'drizzle-orm/d1';

import { users } from './schema';

// Configuration - change these values
const SUPERADMIN_EMAIL = 'pieterjan@wotz.be';
const SUPERADMIN_PASSWORD = 'changeme123';
const SUPERADMIN_NAME = 'Super Admin';

async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function seed(db: ReturnType<typeof drizzle>) {
	console.log('Starting database seed...');

	// Check if superadmin already exists
	const existingUser = await db.select().from(users).where(eq(users.email, SUPERADMIN_EMAIL)).get();

	if (existingUser) {
		console.log(`User ${SUPERADMIN_EMAIL} already exists. Skipping...`);
		return;
	}

	const hashedPassword = await hashPassword(SUPERADMIN_PASSWORD);

	await db.insert(users).values({
		email: SUPERADMIN_EMAIL,
		password: hashedPassword,
		name: SUPERADMIN_NAME,
		role: 'superadmin'
	});

	console.log(`Superadmin user created: ${SUPERADMIN_EMAIL}`);
	console.log('Seed completed successfully!');
}

export { seed };

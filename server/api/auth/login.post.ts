import { eq } from 'drizzle-orm';
import { db } from 'hub:db';
import { z } from 'zod';

import { tables } from '../../utils/drizzle';

const schema = z.object({
	email: z.email(),
	password: z.string().min(8),
	captchaToken: z.string().min(1)
});

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, (body) => schema.parse(body));

	// Verify Turnstile captcha token
	const isValidCaptcha = await verifyTurnstileToken(body.captchaToken);
	if (!isValidCaptcha) {
		throw createError({
			statusCode: 400,
			message: 'Invalid captcha verification'
		});
	}

	const user = await db.select().from(tables.users).where(eq(tables.users.email, body.email)).get();

	if (!user) {
		throw createError({
			statusCode: 401,
			message: 'Invalid email or password'
		});
	}

	const isValidPassword = await verifyPassword(user.password, body.password);

	if (!isValidPassword) {
		throw createError({
			statusCode: 401,
			message: 'Invalid email or password'
		});
	}

	await setUserSession(event, {
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role as 'admin' | 'superadmin'
		}
	});

	return {
		success: true
	};
});

import { db } from 'hub:db';
import { z } from 'zod';

import { tables } from '../../utils/drizzle';

const schema = z.object({
	firstName: z.string().min(1).max(256),
	lastName: z.string().min(1).max(256),
	email: z.string().email().max(256),
	phone: z.string().max(20).optional(),
	timeSlot: z.string().min(1),
	captchaToken: z.string().min(1)
});

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, (body) => schema.parse(body));

	// Verify Turnstile token
	const isValid = await verifyTurnstileToken(body.captchaToken, event);
	if (!isValid) {
		throw createError({
			statusCode: 400,
			message: 'Invalid captcha token'
		});
	}

	const submission = await db
		.insert(tables.formSubmissions)
		.values({
			firstName: body.firstName,
			lastName: body.lastName,
			email: body.email,
			phone: body.phone || null,
			timeSlot: body.timeSlot
		})
		.returning()
		.get();

	return {
		success: true,
		id: submission.id
	};
});

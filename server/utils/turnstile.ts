export async function validateTurnstile(token: string): Promise<boolean> {
	const secretKey = process.env.NUXT_TURNSTILE_SECRET_KEY;

	if (!secretKey) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Internal Server Error',
			message: 'Turnstile secret key not configured'
		});
	}

	const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			secret: secretKey,
			response: token
		})
	});

	const data = (await response.json()) as { success: boolean };
	return data.success;
}

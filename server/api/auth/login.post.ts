import { loginSchema } from '../../../shared/schemas/auth';

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, (body) => loginSchema.parse(body));

	if (!(await verifyTurnstileToken(body.captchaToken))) {
		throw createError({ statusCode: 400, message: 'Captcha-verificatie mislukt, probeer opnieuw' });
	}

	const user = await findUserByCredentials(body.email, body.password);
	await startUserSession(event, user);

	return user;
});

import * as z from 'zod';

export const credentialsSchema = z.object({
	email: z.email('Ongeldig e-mailadres'),
	password: z.string().min(8, 'Minstens 8 tekens')
});

export const loginSchema = credentialsSchema.extend({ captchaToken: z.string().min(1) });

export const registerSchema = z.object({
	invite: z.string().min(1),
	name: z.string().trim().min(1, 'Vul je naam in').max(100),
	password: z.string().min(8, 'Minstens 8 tekens').max(200)
});

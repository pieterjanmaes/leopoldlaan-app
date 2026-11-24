import * as z from 'zod';

import { USER_ROLES } from '../utils/constants';
import { optionalId } from './common';

export const inviteSchema = z.object({
	email: z.email('Ongeldig e-mailadres'),
	name: z.string().trim().max(100).nullable().optional(),
	role: z.enum(USER_ROLES),
	contactId: optionalId
});

export const userUpdateSchema = z.object({
	name: z.string().trim().min(1).max(100).optional(),
	role: z.enum(USER_ROLES).optional(),
	contactId: optionalId
});

export const passwordChangeSchema = z.object({
	currentPassword: z.string().min(1),
	newPassword: z.string().min(8, 'Minstens 8 tekens').max(200)
});

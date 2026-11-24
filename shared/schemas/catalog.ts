import * as z from 'zod';

import { CATEGORY_COLORS } from '../utils/constants';
import { optionalDate, optionalText } from './common';

export const roomSchema = z.object({
	name: z.string().trim().min(1, 'Vul een naam in').max(100),
	floor: z.string().trim().max(50).nullable().optional(),
	notes: optionalText,
	sortOrder: z.number().int().optional()
});

export const categorySchema = z.object({
	name: z.string().trim().min(1, 'Vul een naam in').max(100),
	color: z.enum(CATEGORY_COLORS).optional(),
	icon: z.string().trim().max(100).optional(),
	sortOrder: z.number().int().optional()
});

export const phaseSchema = z.object({
	name: z.string().trim().min(1, 'Vul een naam in').max(100),
	startDate: optionalDate,
	endDate: optionalDate,
	isMilestone: z.boolean().optional(),
	sortOrder: z.number().int().optional()
});

export const contactSchema = z.object({
	name: z.string().trim().min(1, 'Vul een naam in').max(200),
	company: z.string().trim().max(200).nullable().optional(),
	trade: z.string().trim().max(100).nullable().optional(),
	email: z
		.email('Ongeldig e-mailadres')
		.nullable()
		.optional()
		.or(z.literal('').transform(() => null)),
	phone: z.string().trim().max(50).nullable().optional(),
	vatNumber: z.string().trim().max(50).nullable().optional(),
	notes: optionalText
});

export const projectSchema = z.object({
	name: z.string().trim().min(1).max(200).optional(),
	address: z.string().trim().max(300).nullable().optional(),
	startDate: optionalDate,
	targetEndDate: optionalDate,
	contingencyPercent: z.number().int().min(0).max(100).optional()
});

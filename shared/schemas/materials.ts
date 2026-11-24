import * as z from 'zod';

import { MATERIAL_STATUSES, MATERIAL_UNITS } from '../utils/constants';
import { cents, optionalDate, optionalId, optionalText } from './common';

export const materialSchema = z.object({
	name: z.string().trim().min(1, 'Vul in wat er gekocht moet worden').max(200),
	quantity: z.number().positive('Minstens iets').max(1_000_000),
	unit: z.enum(MATERIAL_UNITS),
	unitPriceCents: cents.nullable().optional(),
	status: z.enum(MATERIAL_STATUSES).optional(),
	neededBy: optionalDate,
	orderedOn: optionalDate,
	deliveredOn: optionalDate,
	roomId: optionalId,
	categoryId: optionalId,
	contactId: optionalId,
	taskId: optionalId,
	decisionId: optionalId,
	url: z
		.url('Ongeldige link')
		.max(1000)
		.nullable()
		.optional()
		.or(z.literal('').transform(() => null)),
	notes: optionalText
});

export const materialInvoiceSchema = z.object({
	materialIds: z.array(z.string().min(1)).min(1, 'Kies minstens één aankoop').max(200),
	description: z.string().trim().min(1).max(200).optional(),
	vatRate: z.number().int().min(0).max(30).optional(),
	invoiceDate: optionalDate
});

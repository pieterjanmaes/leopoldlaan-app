import * as z from 'zod';

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum');
export const optionalDate = isoDate.nullable().optional();
export const optionalId = z.string().min(1).nullable().optional();
export const optionalText = z.string().trim().max(5000).nullable().optional();
export const cents = z.number().int().min(0).max(100_000_000_00);
export const vatRate = z.number().int().min(0).max(30);

export const idParams = z.object({ id: z.string().min(1) });

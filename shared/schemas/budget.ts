import * as z from 'zod';

import { PAYMENT_METHODS, QUOTE_STATUSES, SUBSIDY_STATUSES } from '../utils/constants';
import { cents, optionalDate, optionalId, optionalText, vatRate } from './common';

export const budgetLineSchema = z.object({
	label: z.string().trim().min(1, 'Vul een omschrijving in').max(200),
	categoryId: optionalId,
	roomId: optionalId,
	plannedCents: cents,
	notes: optionalText
});

export const quoteSchema = z.object({
	title: z.string().trim().min(1, 'Vul een titel in').max(200),
	contactId: optionalId,
	categoryId: optionalId,
	amountExclCents: cents,
	vatRate: vatRate,
	status: z.enum(QUOTE_STATUSES).optional(),
	receivedOn: optionalDate,
	validUntil: optionalDate,
	notes: optionalText
});

export const expenseSchema = z.object({
	description: z.string().trim().min(1, 'Vul een omschrijving in').max(200),
	contactId: optionalId,
	quoteId: optionalId,
	categoryId: optionalId,
	roomId: optionalId,
	amountExclCents: cents,
	vatRate: vatRate,
	amountInclCents: cents.optional(),
	invoiceNumber: z.string().trim().max(100).nullable().optional(),
	invoiceDate: optionalDate,
	dueDate: optionalDate,
	paidOn: optionalDate,
	paymentMethod: z.enum(PAYMENT_METHODS).nullable().optional(),
	notes: optionalText
});

export const subsidySchema = z.object({
	name: z.string().trim().min(1, 'Vul een naam in').max(200),
	categoryId: optionalId,
	expectedCents: cents,
	receivedCents: cents.optional(),
	status: z.enum(SUBSIDY_STATUSES).optional(),
	deadline: optionalDate,
	notes: optionalText
});

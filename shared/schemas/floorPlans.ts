import * as z from 'zod';

import { CATEGORY_COLORS, PLAN_MARKER_KINDS } from '../utils/constants';
import { optionalId, optionalText } from './common';

const fraction = z.number().min(0).max(1);

export const floorPlanSchema = z.object({
	name: z.string().trim().min(1, 'Vul een naam in').max(100),
	backgroundFileId: optionalId,
	aspectRatio: z.number().min(0.1).max(10).optional(),
	sortOrder: z.number().int().optional()
});

export const planMarkerSchema = z
	.object({
		floorPlanId: z.string().min(1),
		kind: z.enum(PLAN_MARKER_KINDS),
		label: z.string().trim().max(200).optional(),
		note: optionalText,
		color: z.enum(CATEGORY_COLORS).optional(),
		points: z
			.array(z.tuple([fraction, fraction]))
			.min(1)
			.max(200),
		roomId: optionalId,
		taskId: optionalId
	})
	.refine((marker) => (marker.kind === 'pin' ? marker.points.length === 1 : marker.points.length >= 3), {
		message: 'Een pin heeft één punt, een zone minstens drie',
		path: ['points']
	});

export const planMarkerUpdateSchema = z.object({
	label: z.string().trim().max(200).optional(),
	note: optionalText,
	color: z.enum(CATEGORY_COLORS).optional(),
	points: z
		.array(z.tuple([fraction, fraction]))
		.min(1)
		.max(200)
		.optional(),
	roomId: optionalId,
	taskId: optionalId
});

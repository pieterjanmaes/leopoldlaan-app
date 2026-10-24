import * as z from 'zod';

import { TASK_PRIORITIES, TASK_STATUSES } from '../utils/constants';
import { optionalDate, optionalId, optionalText } from './common';

export const taskSchema = z.object({
	title: z.string().trim().min(1, 'Vul een titel in').max(300),
	description: optionalText,
	status: z.enum(TASK_STATUSES).optional(),
	priority: z.enum(TASK_PRIORITIES).optional(),
	roomId: optionalId,
	categoryId: optionalId,
	phaseId: optionalId,
	assigneeUserId: optionalId,
	assigneeContactId: optionalId,
	startDate: optionalDate,
	dueDate: optionalDate,
	dependsOn: z.array(z.string().min(1)).max(50).optional()
});

export const taskUpdateSchema = taskSchema.partial();

/** What an external may change on a task assigned to them. */
export const externalTaskUpdateSchema = taskSchema.pick({ status: true });

export const taskMoveSchema = z.object({
	status: z.enum(TASK_STATUSES),
	/** Task ids of the target column, in their new order. */
	orderedIds: z.array(z.string().min(1)).max(1000)
});

export const commentSchema = z.object({
	body: z.string().trim().min(1, 'Schrijf iets').max(5000)
});

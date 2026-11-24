import * as z from 'zod';

import { DECISION_STATUSES } from '../utils/constants';
import { optionalDate, optionalId, optionalText } from './common';

export const decisionSchema = z.object({
	title: z.string().trim().min(1, 'Vul een titel in').max(200),
	body: optionalText,
	status: z.enum(DECISION_STATUSES).optional(),
	deadline: optionalDate,
	decidedOn: optionalDate,
	roomId: optionalId,
	categoryId: optionalId,
	taskId: optionalId,
	contactId: optionalId,
	reference: z.string().trim().max(300).nullable().optional()
});

import { db } from 'hub:db';

import { decisionSchema } from '../../../shared/schemas/decisions';
import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<DecisionView> => {
	const user = await requireInternal(event);
	const body = await readValidatedBody(event, (body) => decisionSchema.parse(body));

	const decision = await db
		.insert(tables.decisions)
		.values({ ...body, ...decisionStamps(user, body, null), createdBy: user.id })
		.returning()
		.get();

	return toDecisionView(decision, { decidedByName: decision.decidedBy ? user.name : null });
});

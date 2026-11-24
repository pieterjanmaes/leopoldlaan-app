import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { decisionSchema } from '../../../shared/schemas/decisions';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<DecisionView> => {
	const user = await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const body = await readValidatedBody(event, (body) => decisionSchema.partial().parse(body));

	const current = await db.select().from(tables.decisions).where(eq(tables.decisions.id, id)).get();
	if (!current) {
		throw createError({ statusCode: 404, message: 'Beslissing niet gevonden' });
	}

	const decision = await db
		.update(tables.decisions)
		.set({ ...body, ...decisionStamps(user, body, current) })
		.where(eq(tables.decisions.id, id))
		.returning()
		.get();
	const decidedBy = decision?.decidedBy
		? await db
				.select({ name: tables.users.name })
				.from(tables.users)
				.where(eq(tables.users.id, decision.decidedBy))
				.get()
		: undefined;

	return toDecisionView(decision ?? current, { decidedByName: decidedBy?.name ?? null });
});

import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { eq, tables } from '../../utils/drizzle';

/** Markers go with the plan (cascade); the background stays in Drive. */
export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));

	await db.delete(tables.floorPlans).where(eq(tables.floorPlans.id, id));

	return { success: true };
});

import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));

	await db.delete(tables.planMarkers).where(eq(tables.planMarkers.id, id));

	return { success: true };
});

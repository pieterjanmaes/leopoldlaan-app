import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { tables, eq } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));

	await db.delete(tables.rooms).where(eq(tables.rooms.id, id));

	return { success: true };
});

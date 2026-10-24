import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));

	await db.delete(tables.materials).where(eq(tables.materials.id, id));

	return { success: true };
});

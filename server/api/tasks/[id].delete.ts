import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { and, eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));

	await db.batch([
		db
			.delete(tables.attachments)
			.where(and(eq(tables.attachments.entityType, 'task'), eq(tables.attachments.entityId, id))),
		db.delete(tables.tasks).where(eq(tables.tasks.id, id))
	]);

	return { success: true };
});

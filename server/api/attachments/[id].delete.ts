import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { eq, tables } from '../../utils/drizzle';

/** Only removes the link; the file itself stays in Drive. */
export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));

	await db.delete(tables.attachments).where(eq(tables.attachments.id, id));

	return { success: true };
});

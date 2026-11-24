import { db } from 'hub:db';

import { tables } from '../../utils/drizzle';

/** Forgets the tokens. Attachment rows stay, so reconnecting the same Drive brings every link back. */
export default defineEventHandler(async (event) => {
	await requireOwner(event);
	await db.delete(tables.driveConnection);

	return { success: true };
});

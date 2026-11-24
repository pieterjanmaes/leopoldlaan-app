import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	const owner = await requireOwner(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));

	if (id === owner.id) {
		throw createError({ statusCode: 400, message: 'Je kan jezelf niet verwijderen' });
	}

	await db.delete(tables.users).where(eq(tables.users.id, id));

	return { success: true };
});

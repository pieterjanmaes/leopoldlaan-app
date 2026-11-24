import { db } from 'hub:db';

import { roomSchema } from '../../../shared/schemas/catalog';
import { idParams } from '../../../shared/schemas/common';
import { tables, eq } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const body = await readValidatedBody(event, (body) => roomSchema.partial().parse(body));

	const row = await db.update(tables.rooms).set(body).where(eq(tables.rooms.id, id)).returning().get();
	if (!row) {
		throw createError({ statusCode: 404, message: 'Ruimte niet gevonden' });
	}

	return row;
});

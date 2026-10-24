import { db } from 'hub:db';

import { categorySchema } from '../../../shared/schemas/catalog';
import { idParams } from '../../../shared/schemas/common';
import { tables, eq } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const body = await readValidatedBody(event, (body) => categorySchema.partial().parse(body));

	const row = await db.update(tables.categories).set(body).where(eq(tables.categories.id, id)).returning().get();
	if (!row) {
		throw createError({ statusCode: 404, message: 'Werkpost niet gevonden' });
	}

	return row;
});

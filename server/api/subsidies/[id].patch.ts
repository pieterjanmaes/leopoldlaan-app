import { db } from 'hub:db';

import { subsidySchema } from '../../../shared/schemas/budget';
import { idParams } from '../../../shared/schemas/common';
import { tables, eq } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const body = await readValidatedBody(event, (body) => subsidySchema.partial().parse(body));

	const row = await db.update(tables.subsidies).set(body).where(eq(tables.subsidies.id, id)).returning().get();
	if (!row) {
		throw createError({ statusCode: 404, message: 'Premie niet gevonden' });
	}

	return row;
});

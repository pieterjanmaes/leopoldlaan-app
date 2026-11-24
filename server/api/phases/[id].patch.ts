import { db } from 'hub:db';

import { phaseSchema } from '../../../shared/schemas/catalog';
import { idParams } from '../../../shared/schemas/common';
import { tables, eq } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const body = await readValidatedBody(event, (body) => phaseSchema.partial().parse(body));

	const row = await db.update(tables.phases).set(body).where(eq(tables.phases.id, id)).returning().get();
	if (!row) {
		throw createError({ statusCode: 404, message: 'Fase niet gevonden' });
	}

	return row;
});

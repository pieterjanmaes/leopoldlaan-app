import { db } from 'hub:db';

import { contactSchema } from '../../../shared/schemas/catalog';
import { idParams } from '../../../shared/schemas/common';
import { tables, eq } from '../../utils/drizzle';

export default defineEventHandler(async (event) => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const body = await readValidatedBody(event, (body) => contactSchema.partial().parse(body));

	const row = await db.update(tables.contacts).set(body).where(eq(tables.contacts.id, id)).returning().get();
	if (!row) {
		throw createError({ statusCode: 404, message: 'Contact niet gevonden' });
	}

	return row;
});

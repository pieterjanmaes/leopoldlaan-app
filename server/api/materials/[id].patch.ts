import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { materialSchema } from '../../../shared/schemas/materials';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<MaterialView> => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const body = await readValidatedBody(event, (body) => materialSchema.partial().parse(body));

	const current = await db.select().from(tables.materials).where(eq(tables.materials.id, id)).get();
	if (!current) {
		throw createError({ statusCode: 404, message: 'Aankoop niet gevonden' });
	}

	const material = await db
		.update(tables.materials)
		.set({ ...body, ...materialStamps(body, current) })
		.where(eq(tables.materials.id, id))
		.returning()
		.get();

	return toMaterialView(material ?? current, await taskStartDates());
});

import { db } from 'hub:db';

import { materialSchema } from '../../../shared/schemas/materials';
import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<MaterialView> => {
	const user = await requireInternal(event);
	const body = await readValidatedBody(event, (body) => materialSchema.parse(body));

	const material = await db
		.insert(tables.materials)
		.values({ ...body, ...materialStamps(body, null), createdBy: user.id })
		.returning()
		.get();

	return toMaterialView(material, await taskStartDates());
});

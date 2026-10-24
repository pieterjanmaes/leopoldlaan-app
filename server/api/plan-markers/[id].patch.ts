import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { planMarkerUpdateSchema } from '../../../shared/schemas/floorPlans';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<PlanMarkerView> => {
	await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const body = await readValidatedBody(event, (body) => planMarkerUpdateSchema.parse(body));

	const marker = await db.update(tables.planMarkers).set(body).where(eq(tables.planMarkers.id, id)).returning().get();
	if (!marker) {
		throw createError({ statusCode: 404, message: 'Markering niet gevonden' });
	}

	return toPlanMarkerView(marker);
});

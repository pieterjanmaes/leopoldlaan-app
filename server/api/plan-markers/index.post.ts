import { db } from 'hub:db';

import { planMarkerSchema } from '../../../shared/schemas/floorPlans';
import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<PlanMarkerView> => {
	const user = await requireInternal(event);
	const body = await readValidatedBody(event, (body) => planMarkerSchema.parse(body));

	const marker = await db
		.insert(tables.planMarkers)
		.values({ ...body, label: body.label ?? '', createdBy: user.id })
		.returning()
		.get();

	return toPlanMarkerView(marker);
});

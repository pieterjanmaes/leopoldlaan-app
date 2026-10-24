import { db } from 'hub:db';

import { floorPlanSchema } from '../../../shared/schemas/floorPlans';
import { tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<FloorPlanView> => {
	const user = await requireInternal(event);
	const { backgroundFileId, ...body } = await readValidatedBody(event, (body) => floorPlanSchema.parse(body));

	const plan = await db
		.insert(tables.floorPlans)
		.values({ ...body, ...(await resolveBackground(user, backgroundFileId)) })
		.returning()
		.get();

	return toFloorPlanView(plan);
});

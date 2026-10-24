import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { floorPlanSchema } from '../../../shared/schemas/floorPlans';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<FloorPlanView> => {
	const user = await requireInternal(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const { backgroundFileId, ...body } = await readValidatedBody(event, (body) => floorPlanSchema.partial().parse(body));

	const changes = { ...body, ...(await resolveBackground(user, backgroundFileId)) };
	const current = await db.select().from(tables.floorPlans).where(eq(tables.floorPlans.id, id)).get();
	if (!current) {
		throw createError({ statusCode: 404, message: 'Grondplan niet gevonden' });
	}

	const plan = Object.keys(changes).length
		? await db.update(tables.floorPlans).set(changes).where(eq(tables.floorPlans.id, id)).returning().get()
		: current;
	const markers = await db.select().from(tables.planMarkers).where(eq(tables.planMarkers.floorPlanId, id));

	return toFloorPlanView(plan ?? current, markers);
});

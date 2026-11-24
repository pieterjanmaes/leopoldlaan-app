export default defineEventHandler(async (event): Promise<FloorPlanView[]> => {
	await requireInternal(event);

	return await listFloorPlans();
});

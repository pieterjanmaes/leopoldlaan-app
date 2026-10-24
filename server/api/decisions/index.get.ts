export default defineEventHandler(async (event): Promise<DecisionView[]> => {
	await requireInternal(event);

	return await listDecisions();
});

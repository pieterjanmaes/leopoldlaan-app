export default defineEventHandler(async (event): Promise<BudgetOverview> => {
	await requireInternal(event);

	return await getBudgetOverview();
});

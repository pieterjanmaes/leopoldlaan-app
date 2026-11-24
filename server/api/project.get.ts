export default defineEventHandler(async (event): Promise<ProjectView> => {
	await requireUser(event);

	return await getProject();
});

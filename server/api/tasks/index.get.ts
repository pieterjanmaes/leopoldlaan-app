export default defineEventHandler(async (event): Promise<TaskView[]> => {
	const user = await requireUser(event);

	return await listTasks(user);
});

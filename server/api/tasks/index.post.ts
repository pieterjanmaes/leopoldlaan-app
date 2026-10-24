import { db } from 'hub:db';

import { taskSchema } from '../../../shared/schemas/tasks';
import { desc, eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<TaskView> => {
	const user = await requireInternal(event);
	const { dependsOn, ...body } = await readValidatedBody(event, (body) => taskSchema.parse(body));
	const status = body.status ?? 'todo';

	// New tasks go to the bottom of their column.
	const last = await db
		.select({ sortOrder: tables.tasks.sortOrder })
		.from(tables.tasks)
		.where(eq(tables.tasks.status, status))
		.orderBy(desc(tables.tasks.sortOrder))
		.get();

	const task = await db
		.insert(tables.tasks)
		.values({
			...body,
			status,
			doneAt: doneAtFor(status, null),
			sortOrder: (last?.sortOrder ?? 0) + 1,
			createdBy: user.id
		})
		.returning()
		.get();

	if (dependsOn?.length) {
		await setDependencies(task.id, dependsOn);
	}

	const [view] = await hydrateTasks([task]);

	return view as TaskView;
});

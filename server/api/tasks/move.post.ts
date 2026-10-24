import { db } from 'hub:db';

import { taskMoveSchema } from '../../../shared/schemas/tasks';
import { and, eq, inArray, tables } from '../../utils/drizzle';

/** Kanban drop: puts the tasks of one column in the given order and gives them that column's status. */
export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const { status, orderedIds } = await readValidatedBody(event, (body) => taskMoveSchema.parse(body));
	if (orderedIds.length === 0) {
		return { success: true };
	}

	const visible = await db
		.select()
		.from(tables.tasks)
		.where(and(inArray(tables.tasks.id, orderedIds), taskVisibility(user)));
	const byId = new Map(visible.map((task) => [task.id, task]));
	if (byId.size !== new Set(orderedIds).size) {
		throw createError({ statusCode: 404, message: 'Een van de taken werd niet gevonden' });
	}

	await db.batch(
		orderedIds.map((id, index) =>
			db
				.update(tables.tasks)
				.set({ status, sortOrder: index + 1, doneAt: doneAtFor(status, byId.get(id) ?? null) })
				.where(eq(tables.tasks.id, id))
		) as [never, ...never[]]
	);

	return { success: true };
});

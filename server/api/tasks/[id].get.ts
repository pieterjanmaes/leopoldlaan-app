import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { asc, eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<TaskDetail> => {
	const user = await requireUser(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const task = await findVisibleTask(user, id);

	const [[view], comments] = await Promise.all([
		hydrateTasks([task]),
		db
			.select({ comment: tables.taskComments, authorName: tables.users.name })
			.from(tables.taskComments)
			.leftJoin(tables.users, eq(tables.users.id, tables.taskComments.userId))
			.where(eq(tables.taskComments.taskId, id))
			.orderBy(asc(tables.taskComments.createdAt))
	]);

	return {
		...(view as TaskView),
		comments: comments.map(({ comment, authorName }) => ({
			id: comment.id,
			body: comment.body,
			author: comment.userId && authorName ? { id: comment.userId, name: authorName } : null,
			createdAt: comment.createdAt.toISOString()
		}))
	};
});

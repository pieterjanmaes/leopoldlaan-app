import { db } from 'hub:db';

import { idParams } from '../../../../shared/schemas/common';
import { commentSchema } from '../../../../shared/schemas/tasks';
import { tables } from '../../../utils/drizzle';

export default defineEventHandler(async (event): Promise<CommentView> => {
	const user = await requireUser(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	await findVisibleTask(user, id);
	const { body } = await readValidatedBody(event, (body) => commentSchema.parse(body));

	const comment = await db.insert(tables.taskComments).values({ taskId: id, userId: user.id, body }).returning().get();

	return {
		id: comment.id,
		body: comment.body,
		author: { id: user.id, name: user.name },
		createdAt: comment.createdAt.toISOString()
	};
});

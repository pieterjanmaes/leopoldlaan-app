import { db } from 'hub:db';

import { idParams } from '../../../shared/schemas/common';
import { externalTaskUpdateSchema, taskUpdateSchema } from '../../../shared/schemas/tasks';
import { isInternal } from '../../../shared/utils/permissions';
import { eq, tables } from '../../utils/drizzle';

export default defineEventHandler(async (event): Promise<TaskView> => {
	const user = await requireUser(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	const current = await findVisibleTask(user, id);

	// Externals may only move their own tasks along; everything else is for the household.
	const schema = isInternal(user) ? taskUpdateSchema : externalTaskUpdateSchema.strict();
	const { dependsOn, ...body } = await readValidatedBody(event, (body) =>
		(schema as typeof taskUpdateSchema).parse(body)
	);

	if (dependsOn) {
		await setDependencies(id, dependsOn);
	}

	const changes = { ...body, doneAt: doneAtFor(body.status, current) };
	const hasChanges = Object.values(changes).some((value) => value !== undefined);
	const task = hasChanges
		? await db.update(tables.tasks).set(changes).where(eq(tables.tasks.id, id)).returning().get()
		: current;

	const [view] = await hydrateTasks([task ?? current]);

	return view as TaskView;
});

import { db } from 'hub:db';

import { projectSchema } from '../../shared/schemas/catalog';
import { tables, eq } from '../utils/drizzle';

export default defineEventHandler(async (event): Promise<ProjectView> => {
	await requireInternal(event);
	const body = await readValidatedBody(event, (body) => projectSchema.parse(body));

	await getProject();
	await db.update(tables.project).set(body).where(eq(tables.project.id, 'main'));

	return await getProject();
});

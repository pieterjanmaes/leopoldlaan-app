import * as z from 'zod';

const querySchema = z.object({ folderId: z.string().min(1).optional() });

export default defineEventHandler(async (event): Promise<DriveListing> => {
	await requireInternal(event);
	const { folderId } = await getValidatedQuery(event, (query) => querySchema.parse(query));
	const rootId = await requireRootFolderId();
	const targetId = folderId ?? rootId;

	const breadcrumbs = await pathFromRoot(targetId, rootId);
	if (!breadcrumbs) {
		throw createError({ statusCode: 403, message: 'Deze map staat niet in de projectmap' });
	}

	const folder = breadcrumbs[breadcrumbs.length - 1] ?? { id: rootId, name: 'Projectmap' };

	const files = await listDriveFolder(targetId);
	rememberInsideRoot(files.map((file) => file.id));

	return { folder, breadcrumbs, files };
});

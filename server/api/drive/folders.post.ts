import { folderSchema } from '../../../shared/schemas/drive';

export default defineEventHandler(async (event): Promise<DriveFile> => {
	await requireInternal(event);
	const { parentId, name } = await readValidatedBody(event, (body) => folderSchema.parse(body));
	const rootId = await requireRootFolderId();

	if (parentId && parentId !== rootId && !(await pathFromRoot(parentId, rootId))) {
		throw createError({ statusCode: 403, message: 'Deze map staat niet in de projectmap' });
	}

	return await createDriveFolder(name, parentId ?? rootId);
});

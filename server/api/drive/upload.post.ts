import { ATTACHMENT_ENTITIES } from '../../../shared/utils/constants';
import { isInternal } from '../../../shared/utils/permissions';

// Workers accept request bodies up to 100 MB; stay well below so the whole file fits in memory.
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const EXTERNAL_UPLOAD_FOLDER = 'Uploads van externen';

function field(parts: { name?: string; data: Buffer }[], name: string): string | undefined {
	return parts.find((part) => part.name === name)?.data.toString('utf8') || undefined;
}

async function externalUploadFolder(rootId: string): Promise<string> {
	const existing = (await listDriveFolder(rootId)).find(
		(file) => file.isFolder && file.name === EXTERNAL_UPLOAD_FOLDER
	);

	return existing?.id ?? (await createDriveFolder(EXTERNAL_UPLOAD_FOLDER, rootId)).id;
}

/** Uploads one or more files to Drive and, when an entity is given, attaches them to it. */
export default defineEventHandler(async (event): Promise<{ files: DriveFile[]; attachments: AttachmentView[] }> => {
	const user = await requireUser(event);
	const parts = (await readMultipartFormData(event)) ?? [];
	const entityType = field(parts, 'entityType') as AttachmentEntity | undefined;
	const entityId = field(parts, 'entityId');
	const rootId = await requireRootFolderId();

	if (entityType && !ATTACHMENT_ENTITIES.includes(entityType)) {
		throw createError({ statusCode: 400, message: 'Onbekend type' });
	}
	if (entityType && entityId) {
		await assertCanAccessEntity(user, entityType, entityId);
	} else if (!isInternal(user)) {
		throw createError({ statusCode: 403, message: 'Hier heb je geen toegang toe' });
	}

	// Externals can't browse, so their photos go to one fixed folder the household can sort later.
	let folderId = isInternal(user) ? (field(parts, 'folderId') ?? rootId) : await externalUploadFolder(rootId);
	if (folderId !== rootId && isInternal(user) && !(await pathFromRoot(folderId, rootId))) {
		folderId = rootId;
	}

	const fileParts = parts.filter((part) => part.name === 'file' && part.filename);
	if (fileParts.length === 0) {
		throw createError({ statusCode: 400, message: 'Geen bestand ontvangen' });
	}

	const files: DriveFile[] = [];
	const attachments: AttachmentView[] = [];
	for (const part of fileParts) {
		if (part.data.byteLength > MAX_FILE_BYTES) {
			throw createError({ statusCode: 413, message: `${part.filename} is groter dan 50 MB` });
		}
		const file = await uploadDriveFile(folderId, {
			name: part.filename as string,
			type: part.type || 'application/octet-stream',
			data: new Uint8Array(part.data)
		});
		files.push(file);
		if (entityType && entityId) {
			attachments.push(await attachDriveFile(user, entityType, entityId, file));
		}
	}

	return { files, attachments };
});

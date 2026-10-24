import { attachmentSchema } from '../../../shared/schemas/drive';

/** Links an existing Drive file (picked in the browser) to a task, quote, invoice, … */
export default defineEventHandler(async (event): Promise<AttachmentView> => {
	const user = await requireInternal(event);
	const { entityType, entityId, driveFileId } = await readValidatedBody(event, (body) => attachmentSchema.parse(body));
	await assertCanAccessFile(user, driveFileId);

	return await attachDriveFile(user, entityType, entityId, toDriveFile(await getDriveFile(driveFileId)));
});

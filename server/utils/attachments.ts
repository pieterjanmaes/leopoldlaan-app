import { db } from 'hub:db';

import type { User as SessionUser } from '#auth-utils';

import { isInternal } from '../../shared/utils/permissions';
import { and, desc, eq, tables, type Attachment } from './drizzle';

export function toAttachmentView(attachment: Attachment): AttachmentView {
	return {
		id: attachment.id,
		entityType: attachment.entityType,
		entityId: attachment.entityId,
		driveFileId: attachment.driveFileId,
		name: attachment.name,
		mimeType: attachment.mimeType,
		size: attachment.size,
		webViewLink: attachment.webViewLink,
		createdAt: attachment.createdAt.toISOString()
	};
}

/** Externals can only reach the attachments of tasks assigned to them. */
export async function assertCanAccessEntity(
	user: SessionUser,
	entityType: AttachmentEntity,
	entityId: string
): Promise<void> {
	if (isInternal(user)) {
		return;
	}
	if (entityType !== 'task') {
		throw createError({ statusCode: 403, message: 'Hier heb je geen toegang toe' });
	}

	await findVisibleTask(user, entityId);
}

/**
 * Internals may open anything inside the project's root folder; externals only files attached to their tasks.
 * Both checks keep the rest of the connected Google account private.
 */
export async function assertCanAccessFile(user: SessionUser, fileId: string): Promise<void> {
	if (isInternal(user)) {
		const connection = await requireDriveConnection();
		const attached = await db
			.select({ id: tables.attachments.id })
			.from(tables.attachments)
			.where(eq(tables.attachments.driveFileId, fileId))
			.get();
		if (attached || (connection.rootFolderId && (await isInsideRoot(fileId, connection.rootFolderId)))) {
			return;
		}
		throw createError({ statusCode: 403, message: 'Dit bestand staat niet in de projectmap' });
	}

	const links = await db
		.select({ entityId: tables.attachments.entityId })
		.from(tables.attachments)
		.where(and(eq(tables.attachments.driveFileId, fileId), eq(tables.attachments.entityType, 'task')));
	for (const link of links) {
		try {
			await findVisibleTask(user, link.entityId);
			return;
		} catch {
			// Not this task; try the next link.
		}
	}

	throw createError({ statusCode: 403, message: 'Hier heb je geen toegang toe' });
}

export async function listAttachments(entityType: AttachmentEntity, entityId: string): Promise<AttachmentView[]> {
	const rows = await db
		.select()
		.from(tables.attachments)
		.where(and(eq(tables.attachments.entityType, entityType), eq(tables.attachments.entityId, entityId)))
		.orderBy(desc(tables.attachments.createdAt));

	return rows.map(toAttachmentView);
}

export async function attachDriveFile(
	user: SessionUser,
	entityType: AttachmentEntity,
	entityId: string,
	file: DriveFile
): Promise<AttachmentView> {
	const row = await db
		.insert(tables.attachments)
		.values({
			entityType,
			entityId,
			driveFileId: file.id,
			name: file.name,
			mimeType: file.mimeType,
			size: file.size,
			webViewLink: file.webViewLink,
			createdBy: user.id
		})
		.onConflictDoUpdate({
			target: [tables.attachments.entityType, tables.attachments.entityId, tables.attachments.driveFileId],
			set: { name: file.name, mimeType: file.mimeType, size: file.size, webViewLink: file.webViewLink }
		})
		.returning()
		.get();

	return toAttachmentView(row);
}

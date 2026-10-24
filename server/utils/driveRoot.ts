import { db } from 'hub:db';

import { eq, tables } from './drizzle';

/** The first connection creates a project folder in My Drive, so files never land loose in the root. */
export async function ensureRootFolder(): Promise<void> {
	const connection = await requireDriveConnection();
	if (connection.rootFolderId) {
		return;
	}

	const project = await getProject();
	const folder = await createDriveFolder(`Verbouwing – ${project.name}`, 'root');
	await db
		.update(tables.driveConnection)
		.set({ rootFolderId: folder.id, rootFolderName: folder.name })
		.where(eq(tables.driveConnection.id, 'main'));
}

export async function requireRootFolderId(): Promise<string> {
	const connection = await requireDriveConnection();
	if (!connection.rootFolderId) {
		throw createError({ statusCode: 409, message: 'Kies eerst een projectmap in Google Drive' });
	}

	return connection.rootFolderId;
}

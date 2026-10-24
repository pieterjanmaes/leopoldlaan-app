import { db } from 'hub:db';
import * as z from 'zod';

import { eq, tables } from '../../utils/drizzle';

const bodySchema = z.object({ folder: z.string().trim().min(1) });

export default defineEventHandler(async (event): Promise<DriveStatus> => {
	await requireOwner(event);
	const { folder } = await readValidatedBody(event, (body) => bodySchema.parse(body));

	const file = await getDriveFile(parseDriveFolderId(folder));
	if (file.mimeType !== DRIVE_FOLDER_MIME) {
		throw createError({ statusCode: 400, message: 'Dat is geen map' });
	}

	const connection = await requireDriveConnection();
	await db
		.update(tables.driveConnection)
		.set({ rootFolderId: file.id, rootFolderName: file.name })
		.where(eq(tables.driveConnection.id, 'main'));

	return {
		connected: true,
		configured: isDriveConfigured(),
		googleEmail: connection.googleEmail,
		rootFolderId: file.id,
		rootFolderName: file.name
	};
});

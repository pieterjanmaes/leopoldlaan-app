export default defineEventHandler(async (event): Promise<DriveStatus> => {
	await requireInternal(event);
	const connection = await getDriveConnection();

	return {
		connected: Boolean(connection),
		configured: isDriveConfigured(),
		googleEmail: connection?.googleEmail ?? null,
		rootFolderId: connection?.rootFolderId ?? null,
		rootFolderName: connection?.rootFolderName ?? null
	};
});

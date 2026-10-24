import { idParams } from '../../../../../shared/schemas/common';

/** Streams a file through the server, so viewers need neither a Google account nor access to the Drive. */
export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	await assertCanAccessFile(user, id);

	const [file, content] = await Promise.all([getDriveFile(id), fetchDriveContent(id)]);
	const download = getQuery(event).download !== undefined;

	setResponseHeaders(event, {
		'Content-Type': file.mimeType,
		'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
		'Cache-Control': 'private, max-age=300'
	});

	return content.body;
});

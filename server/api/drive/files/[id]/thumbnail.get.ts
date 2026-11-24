import { idParams } from '../../../../../shared/schemas/common';

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const { id } = await getValidatedRouterParams(event, (params) => idParams.parse(params));
	await assertCanAccessFile(user, id);

	const thumbnail = await fetchDriveThumbnail(id);
	setResponseHeaders(event, {
		'Content-Type': thumbnail.headers.get('Content-Type') ?? 'image/jpeg',
		// File ids are stable and thumbnails rarely change, so let the browser keep them for a day.
		'Cache-Control': 'private, max-age=86400'
	});

	return thumbnail.body;
});

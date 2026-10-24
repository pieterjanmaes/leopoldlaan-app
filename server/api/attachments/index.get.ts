import { attachmentQuerySchema } from '../../../shared/schemas/drive';

export default defineEventHandler(async (event): Promise<AttachmentView[]> => {
	const user = await requireUser(event);
	const { entityType, entityId } = await getValidatedQuery(event, (query) => attachmentQuerySchema.parse(query));
	await assertCanAccessEntity(user, entityType, entityId);

	return await listAttachments(entityType, entityId);
});

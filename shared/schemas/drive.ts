import * as z from 'zod';

import { ATTACHMENT_ENTITIES } from '../utils/constants';

export const attachmentSchema = z.object({
	entityType: z.enum(ATTACHMENT_ENTITIES),
	entityId: z.string().min(1),
	driveFileId: z.string().min(1)
});

export const attachmentQuerySchema = z.object({
	entityType: z.enum(ATTACHMENT_ENTITIES),
	entityId: z.string().min(1)
});

export const folderSchema = z.object({
	parentId: z.string().min(1).optional(),
	name: z.string().trim().min(1).max(200)
});

export const rootFolderSchema = z.object({
	folderId: z.string().min(1)
});

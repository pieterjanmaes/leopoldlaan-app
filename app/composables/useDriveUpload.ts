interface UploadResult {
	files: DriveFile[];
	attachments: AttachmentView[];
}

/** Uploads files to the project's Drive, optionally attaching them to a task, quote, invoice, … */
export function useDriveUpload() {
	const uploading = ref(false);
	const showError = useApiError();

	async function upload(
		files: File[],
		target: { folderId?: string; entityType?: AttachmentEntity; entityId?: string } = {}
	): Promise<UploadResult | undefined> {
		if (files.length === 0) {
			return undefined;
		}

		const form = new FormData();
		for (const file of files) {
			form.append('file', file, file.name);
		}
		for (const [key, value] of Object.entries(target)) {
			if (value) form.append(key, value);
		}

		uploading.value = true;
		try {
			// A plain string URL keeps TypeScript from expanding Nitro's route types for this call.
			const url: string = '/api/drive/upload';
			return await $fetch<UploadResult>(url, { method: 'POST', body: form });
		} catch (error) {
			showError(error);

			return undefined;
		} finally {
			uploading.value = false;
		}
	}

	return { upload, uploading: readonly(uploading) };
}

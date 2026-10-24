<template>
	<div class="space-y-3">
		<div class="flex flex-wrap items-center gap-2">
			<UButton
				icon="i-lucide-upload"
				label="Uploaden"
				size="sm"
				color="neutral"
				variant="outline"
				:loading="uploading"
				@click="fileInput?.click()" />
			<UButton
				icon="i-lucide-camera"
				label="Foto"
				size="sm"
				color="neutral"
				variant="outline"
				class="sm:hidden"
				:loading="uploading"
				@click="cameraInput?.click()" />
			<UButton
				v-if="internal"
				icon="i-lucide-hard-drive"
				label="Kies uit Drive"
				size="sm"
				color="neutral"
				variant="outline"
				@click="pickFromDrive" />
			<input
				ref="fileInput"
				type="file"
				multiple
				class="hidden"
				@change="onFiles" />
			<input
				ref="cameraInput"
				type="file"
				accept="image/*"
				capture="environment"
				class="hidden"
				@change="onFiles" />
		</div>

		<p
			v-if="!attachments?.length"
			class="text-muted text-sm">
			Nog geen bestanden.
		</p>
		<ul
			v-else
			class="divide-default divide-y">
			<li
				v-for="attachment in attachments"
				:key="attachment.id"
				class="flex items-center gap-3 py-2">
				<CFileThumb
					:fileId="attachment.driveFileId"
					:mimeType="attachment.mimeType"
					class="size-10" />
				<a
					:href="driveContentUrl(attachment.driveFileId)"
					target="_blank"
					rel="noopener"
					class="min-w-0 flex-1">
					<p class="text-highlighted truncate text-sm font-medium hover:underline">{{ attachment.name }}</p>
					<p class="text-muted text-xs">
						{{ [formatBytes(attachment.size), formatDateTime(attachment.createdAt)].filter(Boolean).join(' · ') }}
					</p>
				</a>
				<UButton
					v-if="attachment.webViewLink && internal"
					:to="attachment.webViewLink"
					target="_blank"
					icon="i-lucide-external-link"
					color="neutral"
					variant="ghost"
					size="sm"
					aria-label="Open in Google Drive" />
				<UButton
					v-if="internal"
					icon="i-lucide-unlink"
					color="neutral"
					variant="ghost"
					size="sm"
					aria-label="Ontkoppel"
					:loading="isPending(attachment.id)"
					@click="unlink(attachment)" />
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
	import { CDrivePickerModal } from '#components';

	const props = defineProps<{
		entityType: AttachmentEntity;
		entityId: string;
	}>();

	const emit = defineEmits<{
		changed: [];
	}>();

	const { user } = useUserSession();
	const internal = computed(() => isInternal(user.value));
	const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
	const cameraInput = useTemplateRef<HTMLInputElement>('cameraInput');

	const { data: attachments, refresh } = useFetch<AttachmentView[]>('/api/attachments', {
		key: `attachments-${props.entityType}-${props.entityId}`,
		query: { entityType: props.entityType, entityId: props.entityId }
	});

	const { upload, uploading } = useDriveUpload();
	const picker = useOverlay().create(CDrivePickerModal);

	async function changed() {
		await refresh();
		emit('changed');
	}

	async function onFiles(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		if (await upload(files, { entityType: props.entityType, entityId: props.entityId })) {
			await changed();
		}
	}

	const { run: link } = useAction(
		async (fileIds: string[]) => {
			for (const driveFileId of fileIds) {
				await $fetch('/api/attachments', {
					method: 'POST',
					body: { entityType: props.entityType, entityId: props.entityId, driveFileId }
				});
			}
		},
		{ success: 'Bestanden gekoppeld', onSuccess: changed }
	);

	async function pickFromDrive() {
		const fileIds = await picker.open().result;
		if (Array.isArray(fileIds) && fileIds.length > 0) {
			await link(fileIds);
		}
	}

	const { run: unlink, isPending } = useKeyedAction(
		([attachment]) => attachment.id,
		(attachment: AttachmentView) => $fetch(`/api/attachments/${attachment.id}`, { method: 'DELETE' }),
		{ onSuccess: changed }
	);
</script>

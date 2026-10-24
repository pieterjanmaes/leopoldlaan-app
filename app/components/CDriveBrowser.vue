<template>
	<div
		ref="dropZone"
		class="relative space-y-4">
		<div class="flex flex-wrap items-center gap-2">
			<UBreadcrumb
				:items="breadcrumbItems"
				class="min-w-0 flex-1" />
			<UFieldGroup>
				<UButton
					icon="i-lucide-layout-grid"
					:color="layout === 'grid' ? 'primary' : 'neutral'"
					variant="subtle"
					aria-label="Rasterweergave"
					@click="layout = 'grid'" />
				<UButton
					icon="i-lucide-list"
					:color="layout === 'list' ? 'primary' : 'neutral'"
					variant="subtle"
					aria-label="Lijstweergave"
					@click="layout = 'list'" />
			</UFieldGroup>
			<UButton
				icon="i-lucide-folder-plus"
				label="Map"
				color="neutral"
				variant="outline"
				@click="newFolder" />
			<UButton
				icon="i-lucide-upload"
				label="Uploaden"
				:loading="uploading"
				@click="fileInput?.click()" />
			<input
				ref="fileInput"
				type="file"
				multiple
				class="hidden"
				@change="onFiles" />
		</div>

		<div
			v-if="status === 'pending' && !listing"
			class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
			<USkeleton
				v-for="index in 6"
				:key="index"
				class="aspect-square" />
		</div>

		<UEmpty
			v-else-if="error"
			icon="i-lucide-cloud-off"
			title="Drive kon niet geladen worden"
			:description="(error.data as { message?: string } | undefined)?.message" />

		<UEmpty
			v-else-if="listing && listing.files.length === 0"
			icon="i-lucide-folder-open"
			title="Deze map is leeg"
			description="Sleep bestanden hierheen of klik op Uploaden." />

		<div
			v-else-if="layout === 'grid'"
			class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
			<button
				v-for="file in listing?.files"
				:key="file.id"
				type="button"
				class="group border-default hover:border-accented relative flex flex-col overflow-hidden rounded-lg border text-left"
				:class="{ 'ring-primary ring-2': selected.has(file.id) }"
				@click="activate(file)">
				<CFileThumb
					:fileId="file.id"
					:mimeType="file.mimeType"
					:hasThumbnail="file.hasThumbnail"
					class="aspect-square w-full rounded-none" />
				<span class="text-highlighted truncate px-2 py-1.5 text-xs font-medium">{{ file.name }}</span>
				<UIcon
					v-if="selected.has(file.id)"
					name="i-lucide-circle-check"
					class="text-primary bg-default absolute top-2 right-2 size-5 rounded-full" />
			</button>
		</div>

		<ul
			v-else
			class="divide-default border-default divide-y rounded-lg border">
			<li
				v-for="file in listing?.files"
				:key="file.id">
				<button
					type="button"
					class="hover:bg-elevated/50 flex w-full items-center gap-3 px-3 py-2 text-left"
					:class="{ 'bg-primary/10': selected.has(file.id) }"
					@click="activate(file)">
					<UIcon
						:name="fileIcon(file.mimeType)"
						class="text-muted size-5 shrink-0" />
					<span class="text-highlighted min-w-0 flex-1 truncate text-sm">{{ file.name }}</span>
					<span class="text-muted hidden text-xs sm:inline">{{ formatBytes(file.size) }}</span>
					<span
						v-if="file.modifiedTime"
						class="text-muted hidden w-36 text-right text-xs sm:inline">
						{{ formatDateTime(file.modifiedTime) }}
					</span>
				</button>
			</li>
		</ul>

		<div
			v-if="isOverDropZone"
			class="border-primary bg-primary/10 text-primary pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed font-medium">
			Laat los om te uploaden naar {{ listing?.folder.name }}
		</div>

		<UModal
			v-model:open="previewOpen"
			:title="previewFile?.name"
			:ui="{ content: 'sm:max-w-4xl' }">
			<template #body>
				<img
					v-if="previewFile?.mimeType.startsWith('image/')"
					:src="driveContentUrl(previewFile.id)"
					:alt="previewFile.name"
					class="mx-auto max-h-[70vh] rounded-md" />
				<iframe
					v-else-if="previewFile?.mimeType === 'application/pdf'"
					:src="driveContentUrl(previewFile.id)"
					:title="previewFile.name"
					class="h-[70vh] w-full rounded-md" />
			</template>
			<template #footer>
				<div class="flex w-full justify-end gap-2">
					<UButton
						v-if="previewFile?.webViewLink"
						:to="previewFile.webViewLink"
						target="_blank"
						icon="i-lucide-external-link"
						label="Open in Drive"
						color="neutral"
						variant="outline" />
					<UButton
						v-if="previewFile"
						:to="driveContentUrl(previewFile.id, true)"
						external
						icon="i-lucide-download"
						label="Download" />
				</div>
			</template>
		</UModal>
	</div>
</template>

<script setup lang="ts">
	import type { BreadcrumbItem } from '@nuxt/ui';

	const props = defineProps<{
		/** Picker mode: clicking files toggles selection instead of opening them. */
		selectable?: boolean;
	}>();

	const selected = defineModel<Set<string>>('selected', { default: () => new Set() });

	const folderId = ref<string | undefined>();
	const layout = useLocalStorage<'grid' | 'list'>('drive-layout', 'grid');
	const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
	const dropZone = useTemplateRef<HTMLElement>('dropZone');
	const previewOpen = ref(false);
	const previewFile = ref<DriveFile | null>(null);

	const {
		data: listing,
		status,
		error,
		refresh
	} = useFetch<DriveListing>('/api/drive/files', {
		query: { folderId },
		watch: [folderId]
	});

	const breadcrumbItems = computed<BreadcrumbItem[]>(() =>
		(listing.value?.breadcrumbs ?? []).map((crumb, index, all) => ({
			label: index === 0 ? 'Projectmap' : crumb.name,
			icon: index === 0 ? 'i-lucide-hard-drive' : undefined,
			onClick: index === all.length - 1 ? undefined : () => (folderId.value = crumb.id)
		}))
	);

	function activate(file: DriveFile) {
		if (file.isFolder) {
			folderId.value = file.id;
			return;
		}
		if (props.selectable) {
			const next = new Set(selected.value);
			if (next.has(file.id)) {
				next.delete(file.id);
			} else {
				next.add(file.id);
			}
			selected.value = next;
			return;
		}
		if (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') {
			previewFile.value = file;
			previewOpen.value = true;
			return;
		}
		window.open(file.webViewLink ?? driveContentUrl(file.id), '_blank', 'noopener');
	}

	const { upload, uploading } = useDriveUpload();

	async function uploadHere(files: File[]) {
		if (await upload(files, { folderId: listing.value?.folder.id })) {
			await refresh();
		}
	}

	async function onFiles(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		await uploadHere(files);
	}

	const { isOverDropZone } = useDropZone(dropZone, { onDrop: (files) => uploadHere(files ?? []) });

	const { run: createFolder } = useAction(
		(name: string) =>
			$fetch<DriveFile>('/api/drive/folders', { method: 'POST', body: { name, parentId: listing.value?.folder.id } }),
		{ success: 'Map aangemaakt', onSuccess: () => refresh() }
	);

	async function newFolder() {
		const name = window.prompt('Naam van de nieuwe map')?.trim();
		if (name) {
			await createFolder(name);
		}
	}
</script>

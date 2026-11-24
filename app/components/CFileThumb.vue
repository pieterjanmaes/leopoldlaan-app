<template>
	<div class="bg-elevated flex shrink-0 items-center justify-center overflow-hidden rounded-md">
		<img
			v-if="showImage"
			:src="driveThumbnailUrl(fileId)"
			alt=""
			loading="lazy"
			class="size-full object-cover"
			@error="failed = true" />
		<UIcon
			v-else
			:name="fileIcon(mimeType)"
			class="text-muted size-1/2" />
	</div>
</template>

<script setup lang="ts">
	const props = defineProps<{
		fileId: string;
		mimeType: string;
		hasThumbnail?: boolean;
	}>();

	const failed = ref(false);
	// Drive makes thumbnails for images, PDFs and office files; folders and Google-native docs often have none.
	const showImage = computed(
		() =>
			!failed.value &&
			(props.hasThumbnail ?? (props.mimeType.startsWith('image/') || props.mimeType === 'application/pdf'))
	);
</script>

<template>
	<div class="flex justify-end gap-2 pt-2">
		<slot />
		<UButton
			label="Annuleer"
			color="neutral"
			variant="ghost"
			@click="emit('cancel')" />
		<UButton
			type="submit"
			:label="submitLabel"
			:loading="loading" />
	</div>
</template>

<script setup lang="ts">
	withDefaults(
		defineProps<{
			loading?: boolean;
			submitLabel?: string;
		}>(),
		{ submitLabel: 'Bewaar' }
	);

	const emit = defineEmits<{
		cancel: [];
	}>();
</script>

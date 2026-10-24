<template>
	<UModal
		:title="title"
		:description="description"
		:ui="{ footer: 'justify-end' }">
		<template #footer>
			<UButton
				label="Annuleer"
				color="neutral"
				variant="ghost"
				@click="emit('close', false)" />
			<UButton
				:label="confirmLabel ?? 'Verwijder'"
				color="error"
				@click="emit('close', true)" />
		</template>
	</UModal>
</template>

<script setup lang="ts">
	/** Opened through useConfirm(); resolves the overlay with true or false. Dismissing resolves with undefined. */
	defineProps<{
		title: string;
		description?: string;
		confirmLabel?: string;
	}>();

	const emit = defineEmits<{
		close: [confirmed: boolean];
	}>();
</script>

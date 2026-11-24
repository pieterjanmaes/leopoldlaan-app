<template>
	<UModal
		title="Kies bestanden uit Drive"
		description="Klik op bestanden om ze te selecteren; mappen openen met één klik."
		:ui="{ content: 'sm:max-w-4xl', footer: 'justify-end' }">
		<template #body>
			<CDriveBrowser
				v-model:selected="selected"
				selectable />
		</template>
		<template #footer>
			<UButton
				label="Annuleer"
				color="neutral"
				variant="ghost"
				@click="emit('close', [])" />
			<UButton
				:label="selected.size ? `Koppel ${selected.size} bestand${selected.size === 1 ? '' : 'en'}` : 'Koppel'"
				:disabled="selected.size === 0"
				@click="emit('close', [...selected])" />
		</template>
	</UModal>
</template>

<script setup lang="ts">
	const emit = defineEmits<{
		close: [fileIds: string[]];
	}>();

	const selected = ref(new Set<string>());
</script>

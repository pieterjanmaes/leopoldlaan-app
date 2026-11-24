<template>
	<UModal
		title="Nieuwe taak"
		:ui="{ content: 'sm:max-w-2xl' }">
		<template #body>
			<CTaskForm
				:initial="initial"
				submitLabel="Taak toevoegen"
				:loading="pending"
				@submit="create">
				<template #actions>
					<UButton
						label="Annuleer"
						color="neutral"
						variant="ghost"
						@click="emit('close', null)" />
				</template>
			</CTaskForm>
		</template>
	</UModal>
</template>

<script setup lang="ts">
	import type { TaskFormState } from './CTaskForm.vue';

	defineProps<{
		initial?: Partial<TaskFormState>;
	}>();

	const emit = defineEmits<{
		close: [task: TaskView | null];
	}>();

	const { run: create, pending } = useAction(
		(state: TaskFormState) => $fetch<TaskView>('/api/tasks', { method: 'POST', body: state }),
		{ success: 'Taak toegevoegd', onSuccess: (task) => emit('close', task) }
	);
</script>

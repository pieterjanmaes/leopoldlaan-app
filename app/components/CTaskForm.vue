<template>
	<UForm
		:schema="taskSchema"
		:state="state"
		class="space-y-4"
		@submit="onSubmit">
		<UFormField
			label="Titel"
			name="title"
			required>
			<UInput
				v-model="state.title"
				placeholder="Bv. stopcontacten keuken plaatsen"
				class="w-full"
				autofocus />
		</UFormField>

		<UFormField
			label="Omschrijving"
			name="description">
			<UTextarea
				v-model="description"
				:rows="3"
				autoresize
				class="w-full" />
		</UFormField>

		<div class="grid gap-4 sm:grid-cols-2">
			<UFormField
				label="Status"
				name="status">
				<USelect
					v-model="state.status"
					:items="statusOptions"
					class="w-full" />
			</UFormField>
			<UFormField
				label="Prioriteit"
				name="priority">
				<USelect
					v-model="state.priority"
					:items="priorityOptions"
					class="w-full" />
			</UFormField>
			<UFormField
				label="Werkpost"
				name="categoryId">
				<USelectMenu
					v-model="state.categoryId"
					:items="categoryOptions"
					valueKey="value"
					placeholder="Kies een werkpost"
					clear
					class="w-full" />
			</UFormField>
			<UFormField
				label="Ruimte"
				name="roomId">
				<USelectMenu
					v-model="state.roomId"
					:items="roomOptions"
					valueKey="value"
					placeholder="Kies een ruimte"
					clear
					class="w-full" />
			</UFormField>
			<UFormField
				label="Fase"
				name="phaseId">
				<USelectMenu
					v-model="state.phaseId"
					:items="phaseOptions"
					valueKey="value"
					placeholder="Kies een fase"
					clear
					class="w-full" />
			</UFormField>
			<UFormField
				label="Wie"
				name="assignee">
				<USelectMenu
					v-model="assignee"
					:items="assigneeOptions"
					valueKey="value"
					placeholder="Niemand"
					clear
					class="w-full" />
			</UFormField>
			<UFormField
				label="Start"
				name="startDate">
				<CDateInput v-model="state.startDate" />
			</UFormField>
			<UFormField
				label="Deadline"
				name="dueDate">
				<CDateInput v-model="state.dueDate" />
			</UFormField>
		</div>

		<UFormField
			label="Wacht op"
			name="dependsOn"
			description="Deze taak kan pas starten als deze taken klaar zijn.">
			<USelectMenu
				v-model="state.dependsOn"
				:items="dependencyOptions"
				valueKey="value"
				multiple
				placeholder="Geen"
				class="w-full" />
		</UFormField>

		<div class="flex justify-end gap-2">
			<slot name="actions" />
			<UButton
				type="submit"
				:label="submitLabel"
				:loading="loading" />
		</div>
	</UForm>
</template>

<script setup lang="ts">
	import type * as z from 'zod';

	import { taskSchema } from '#shared/schemas/tasks';

	export type TaskFormState = z.input<typeof taskSchema>;

	const props = withDefaults(
		defineProps<{
			task?: TaskView | null;
			initial?: Partial<TaskFormState>;
			submitLabel?: string;
			loading?: boolean;
		}>(),
		{ task: null, initial: () => ({}), submitLabel: 'Bewaar' }
	);

	const emit = defineEmits<{
		submit: [state: TaskFormState];
	}>();

	useZodLocale();

	const { categoryOptions, roomOptions, phaseOptions, lookups } = useLookups();
	const { tasks } = useTasks();

	function fromTask(task: TaskView | null): TaskFormState {
		return {
			title: task?.title ?? '',
			description: task?.description ?? null,
			status: task?.status ?? 'todo',
			priority: task?.priority ?? 'normal',
			roomId: task?.roomId ?? null,
			categoryId: task?.categoryId ?? null,
			phaseId: task?.phaseId ?? null,
			assigneeUserId: task?.assigneeUserId ?? null,
			assigneeContactId: task?.assigneeContactId ?? null,
			startDate: task?.startDate ?? null,
			dueDate: task?.dueDate ?? null,
			dependsOn: task?.dependsOn ?? [],
			...props.initial
		};
	}

	const state = reactive<TaskFormState>(fromTask(props.task));
	watch(
		() => props.task,
		(task) => Object.assign(state, fromTask(task))
	);

	const description = computed({
		get: () => state.description ?? '',
		set: (value: string) => {
			state.description = value || null;
		}
	});

	const assignee = computed({
		get: () =>
			assigneeValue({
				assigneeUserId: state.assigneeUserId ?? null,
				assigneeContactId: state.assigneeContactId ?? null
			}),
		set: (value: string | undefined) => Object.assign(state, parseAssignee(value))
	});

	const statusOptions = TASK_STATUSES.map((status) => ({ label: TASK_STATUS_META[status].label, value: status }));
	const priorityOptions = TASK_PRIORITIES.map((priority) => ({
		label: TASK_PRIORITY_META[priority].label,
		value: priority
	}));

	const assigneeOptions = computed(() => [
		{ type: 'label' as const, label: 'Huisgenoten' },
		...lookups.value.users.map((user) => ({ label: user.name, value: `user:${user.id}`, icon: 'i-lucide-user' })),
		{ type: 'label' as const, label: 'Aannemers & contacten' },
		...lookups.value.contacts.map((contact) => ({
			label: contact.company ? `${contact.name} (${contact.company})` : contact.name,
			value: `contact:${contact.id}`,
			icon: 'i-lucide-hard-hat'
		}))
	]);

	const dependencyOptions = computed(() =>
		tasks.value.filter((task) => task.id !== props.task?.id).map((task) => ({ label: task.title, value: task.id }))
	);

	function onSubmit() {
		emit('submit', { ...state });
	}
</script>

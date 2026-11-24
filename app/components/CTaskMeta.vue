<template>
	<div class="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
		<span
			v-if="category"
			class="flex items-center gap-1">
			<CCategoryDot :color="category.color" />
			{{ category.name }}
		</span>
		<span
			v-if="room"
			class="flex items-center gap-1">
			<UIcon
				name="i-lucide-door-closed"
				class="size-3.5" />
			{{ room.name }}
		</span>
		<span
			v-if="task.dueDate"
			class="flex items-center gap-1"
			:class="{ 'text-error font-medium': overdue }">
			<UIcon
				name="i-lucide-calendar"
				class="size-3.5" />
			{{ dueLabel(task.dueDate, today) }}
		</span>
		<span
			v-if="assignee"
			class="flex items-center gap-1">
			<UIcon
				:name="task.assigneeContactId ? 'i-lucide-hard-hat' : 'i-lucide-user'"
				class="size-3.5" />
			{{ assignee }}
		</span>
		<span
			v-if="blocked"
			class="text-warning flex items-center gap-1">
			<UIcon
				name="i-lucide-link"
				class="size-3.5" />
			wacht op andere taak
		</span>
		<span
			v-if="task.commentCount"
			class="flex items-center gap-1">
			<UIcon
				name="i-lucide-message-square"
				class="size-3.5" />
			{{ task.commentCount }}
		</span>
		<span
			v-if="task.attachmentCount"
			class="flex items-center gap-1">
			<UIcon
				name="i-lucide-paperclip"
				class="size-3.5" />
			{{ task.attachmentCount }}
		</span>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps<{
		task: TaskView;
		blocked?: boolean;
	}>();

	const { categories, rooms, users, contacts } = useLookups();
	const today = todayIso();

	const category = computed(() => (props.task.categoryId ? categories.value.get(props.task.categoryId) : undefined));
	const room = computed(() => (props.task.roomId ? rooms.value.get(props.task.roomId) : undefined));
	const overdue = computed(
		() => props.task.status !== 'done' && Boolean(props.task.dueDate && props.task.dueDate < today)
	);
	const assignee = computed(() => {
		if (props.task.assigneeUserId) return users.value.get(props.task.assigneeUserId)?.name;
		if (props.task.assigneeContactId) return contacts.value.get(props.task.assigneeContactId)?.name;

		return undefined;
	});
</script>

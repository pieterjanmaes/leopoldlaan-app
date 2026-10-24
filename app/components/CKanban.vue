<template>
	<div class="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4">
		<section
			v-for="column in columns"
			:key="column.status"
			class="bg-elevated/50 flex w-[80vw] max-w-xs shrink-0 snap-start flex-col rounded-xl p-2 sm:w-72 lg:w-auto lg:max-w-none"
			:aria-label="column.label">
			<header class="flex items-center gap-2 px-1 pt-1 pb-2">
				<UIcon
					:name="column.icon"
					class="text-muted size-4" />
				<h3 class="text-highlighted text-sm font-semibold">{{ column.label }}</h3>
				<UBadge
					:label="String(column.tasks.length)"
					color="neutral"
					variant="subtle"
					size="sm" />
			</header>
			<div
				:ref="(el) => registerColumn(column.status, el as HTMLElement | null)"
				:data-status="column.status"
				class="flex min-h-24 flex-1 flex-col gap-2">
				<CTaskCard
					v-for="task in column.tasks"
					:key="task.id"
					:data-id="task.id"
					:task="task"
					:blocked="isBlocked(task, statusById)"
					@open="emit('open', $event)" />
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	import Sortable from 'sortablejs';

	const props = defineProps<{
		tasks: TaskView[];
		statusById: Map<string, TaskStatus>;
	}>();

	const emit = defineEmits<{
		open: [id: string];
		move: [move: { taskId: string; status: TaskStatus; orderedIds: string[] }];
	}>();

	const columns = computed(() =>
		TASK_STATUSES.map((status) => ({
			status,
			...TASK_STATUS_META[status],
			tasks: props.tasks.filter((task) => task.status === status)
		}))
	);

	const sortables = new Map<TaskStatus, Sortable>();

	function onEnd(event: Sortable.SortableEvent) {
		const target = event.to;
		const status = target.dataset.status as TaskStatus;
		const orderedIds = [...target.children].map((child) => (child as HTMLElement).dataset.id ?? '').filter(Boolean);
		const taskId = (event.item as HTMLElement).dataset.id;

		// Hand the DOM back to Vue: put the card where it was and let the reactive list re-render it.
		event.from.insertBefore(event.item, event.from.children[event.oldIndex ?? 0] ?? null);

		if (taskId && (event.from !== event.to || event.oldIndex !== event.newIndex)) {
			emit('move', { taskId, status, orderedIds });
		}
	}

	function registerColumn(status: TaskStatus, el: HTMLElement | null) {
		if (!el || sortables.has(status)) {
			return;
		}
		sortables.set(
			status,
			Sortable.create(el, {
				group: 'tasks',
				animation: 150,
				// Long-press on touch screens, so scrolling the board doesn't start a drag.
				delay: 200,
				delayOnTouchOnly: true,
				ghostClass: 'opacity-40',
				onEnd
			})
		);
	}

	onBeforeUnmount(() => {
		for (const sortable of sortables.values()) {
			sortable.destroy();
		}
		sortables.clear();
	});
</script>

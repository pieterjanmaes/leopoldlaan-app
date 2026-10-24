<template>
	<button
		type="button"
		class="border-default bg-default hover:border-accented focus-visible:ring-primary w-full cursor-grab rounded-lg border p-3 text-left shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
		@click="emit('open', task.id)">
		<div class="flex items-start gap-2">
			<UIcon
				v-if="task.priority === 'high'"
				name="i-lucide-flag"
				class="text-error mt-0.5 size-4 shrink-0"
				aria-label="Hoge prioriteit" />
			<p
				class="text-highlighted min-w-0 flex-1 text-sm font-medium"
				:class="{ 'text-muted line-through': task.status === 'done' }">
				{{ task.title }}
			</p>
		</div>
		<CTaskMeta
			:task="task"
			:blocked="blocked"
			class="mt-2" />
	</button>
</template>

<script setup lang="ts">
	defineProps<{
		task: TaskView;
		blocked?: boolean;
	}>();

	const emit = defineEmits<{
		open: [id: string];
	}>();
</script>

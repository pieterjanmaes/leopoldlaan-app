<template>
	<ul
		v-if="tasks.length"
		class="divide-default divide-y">
		<li
			v-for="task in tasks"
			:key="task.id">
			<NuxtLink
				:to="{ path: '/taken', query: { taak: task.id } }"
				class="hover:bg-elevated/50 -mx-2 flex flex-col gap-1 rounded-md px-2 py-2">
				<span class="text-highlighted text-sm font-medium">{{ task.title }}</span>
				<CTaskMeta :task="task" />
			</NuxtLink>
		</li>
	</ul>
	<p
		v-else
		class="text-muted py-2 text-sm">
		{{ empty }}
	</p>
</template>

<script setup lang="ts">
	defineProps<{
		tasks: TaskView[];
		empty: string;
	}>();
</script>

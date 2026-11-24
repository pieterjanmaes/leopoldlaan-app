<template>
	<CPage
		id="planning"
		title="Planning"
		wide>
		<template #actions>
			<UFieldGroup>
				<UButton
					icon="i-lucide-zoom-out"
					color="neutral"
					variant="outline"
					aria-label="Uitzoomen"
					:disabled="zoom === 0"
					@click="zoom--" />
				<UButton
					icon="i-lucide-zoom-in"
					color="neutral"
					variant="outline"
					aria-label="Inzoomen"
					:disabled="zoom === ZOOM_LEVELS.length - 1"
					@click="zoom++" />
			</UFieldGroup>
		</template>

		<UAlert
			v-if="issueCount > 0"
			icon="i-lucide-triangle-alert"
			color="warning"
			variant="subtle"
			:title="`${issueCount} ${issueCount === 1 ? 'taak start' : 'taken starten'} vóór een taak waarop ze wachten`"
			description="Ze zijn rood omrand. Schuif de datums op of pas de afhankelijkheid aan." />

		<UEmpty
			v-if="tasks.length === 0 && lookups.phases.length === 0"
			icon="i-lucide-calendar-range"
			title="Nog niets ingepland"
			description="Geef taken een start- en einddatum, of maak fases aan in Instellingen." />

		<CGantt
			v-else
			:tasks="tasks"
			:phases="lookups.phases"
			:dayWidth="ZOOM_LEVELS[zoom] ?? 6"
			@open="openTask" />

		<UCard v-if="unscheduled.length">
			<template #header>
				<CSectionHeading
					size="sm"
					title="Nog niet ingepland"
					:description="`${unscheduled.length} open taken zonder datum`" />
			</template>
			<ul class="divide-default divide-y">
				<li
					v-for="task in unscheduled"
					:key="task.id">
					<button
						type="button"
						class="hover:bg-elevated/50 flex w-full items-center gap-3 py-2 text-left"
						@click="openTask(task.id)">
						<span class="text-highlighted min-w-0 flex-1 truncate text-sm">{{ task.title }}</span>
						<CTaskMeta :task="task" />
					</button>
				</li>
			</ul>
		</UCard>

		<CTaskSlideover
			:taskId="selectedId"
			@close="selectedId = null"
			@changed="refresh" />
	</CPage>
</template>

<script setup lang="ts">
	definePageMeta({ middleware: 'internal' });

	const ZOOM_LEVELS = [3, 6, 12, 24];

	const { tasks, refresh } = useTasks();
	const { lookups } = useLookups();
	const zoom = useLocalStorage('planning-zoom', 1);
	const selectedId = ref<string | null>(null);

	const unscheduled = computed(() =>
		tasks.value.filter((task) => !task.startDate && !task.dueDate && task.status !== 'done')
	);
	const issueCount = computed(() => new Set(findDependencyIssues(tasks.value).map((issue) => issue.taskId)).size);

	function openTask(id: string) {
		selectedId.value = id;
	}
</script>

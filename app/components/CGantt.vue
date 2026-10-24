<template>
	<div class="border-default overflow-hidden rounded-lg border">
		<div class="overflow-x-auto">
			<div
				class="relative"
				:style="{ width: `calc(${LABEL_WIDTH} + ${totalWidth}px)` }">
				<!-- Header: months and week numbers, sticky above the rows. -->
				<div class="bg-default border-default sticky top-0 z-20 flex border-b">
					<div
						class="bg-default border-default sticky left-0 z-30 shrink-0 border-r px-3 py-2 text-xs font-medium"
						:style="{ width: LABEL_WIDTH }">
						Taak
					</div>
					<div
						class="relative"
						:style="{ width: `${totalWidth}px` }">
						<div class="border-default relative h-6 border-b">
							<span
								v-for="month in months"
								:key="month.key"
								class="text-highlighted border-default absolute top-0 h-full truncate border-l px-1.5 text-xs leading-6 font-medium"
								:style="{ left: `${month.left}px`, width: `${month.width}px` }">
								{{ month.label }}
							</span>
						</div>
						<div class="relative h-5">
							<span
								v-for="week in weeks"
								:key="week.start"
								class="text-dimmed border-default absolute top-0 h-full border-l px-1 text-[10px] leading-5 tabular-nums"
								:style="{ left: `${week.left}px`, width: `${weekWidth}px` }">
								{{ weekWidth >= 28 ? week.label : '' }}
							</span>
						</div>
					</div>
				</div>

				<!-- Body -->
				<div class="relative">
					<!-- Week grid, today line and milestones span all rows. -->
					<div
						class="pointer-events-none absolute inset-y-0 z-0"
						:style="{ left: LABEL_WIDTH, width: `${totalWidth}px` }">
						<span
							v-for="week in weeks"
							:key="week.start"
							class="border-default/60 absolute inset-y-0 border-l"
							:style="{ left: `${week.left}px` }" />
						<span
							v-for="milestone in milestones"
							:key="milestone.id"
							class="border-primary/60 absolute inset-y-0 border-l border-dashed"
							:style="{ left: `${milestone.left}px` }" />
						<span
							v-if="todayLeft !== null"
							class="bg-error absolute inset-y-0 w-0.5"
							:style="{ left: `${todayLeft}px` }" />
					</div>

					<div
						v-if="milestones.length"
						class="border-default relative z-10 flex h-9 border-b">
						<div
							class="bg-default border-default text-muted sticky left-0 flex shrink-0 items-center gap-2 border-r px-3 text-xs font-medium"
							:style="{ width: LABEL_WIDTH }">
							<UIcon
								name="i-lucide-flag"
								class="size-3.5" />
							Mijlpalen
						</div>
						<div class="relative flex-1">
							<UTooltip
								v-for="milestone in milestones"
								:key="milestone.id"
								:text="`${milestone.name} · ${formatDate(milestone.date)}`">
								<span
									class="bg-primary ring-default absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 ring-2"
									:style="{ left: `${milestone.left}px` }"
									:aria-label="milestone.name" />
							</UTooltip>
						</div>
					</div>

					<template
						v-for="group in groups"
						:key="group.id">
						<div class="border-default bg-elevated/40 relative z-10 flex h-8 border-b">
							<div
								class="bg-elevated border-default text-highlighted sticky left-0 flex shrink-0 items-center truncate border-r px-3 text-xs font-semibold"
								:style="{ width: LABEL_WIDTH }">
								{{ group.name }}
							</div>
							<div class="relative flex-1">
								<span
									v-if="group.bar"
									class="bg-accented/70 absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
									:style="{ left: `${group.bar.left}px`, width: `${group.bar.width}px` }" />
							</div>
						</div>
						<div
							v-for="row in group.rows"
							:key="row.task.id"
							class="border-default/60 relative z-10 flex h-9 border-b">
							<button
								type="button"
								class="bg-default border-default hover:bg-elevated/50 sticky left-0 flex shrink-0 items-center gap-2 truncate border-r px-3 text-left text-sm"
								:style="{ width: LABEL_WIDTH }"
								@click="emit('open', row.task.id)">
								<UIcon
									:name="TASK_STATUS_META[row.task.status].icon"
									class="text-muted size-3.5 shrink-0" />
								<span
									class="truncate"
									:class="{ 'text-muted line-through': row.task.status === 'done' }">
									{{ row.task.title }}
								</span>
							</button>
							<div class="relative flex-1">
								<UTooltip :text="row.tooltip">
									<button
										type="button"
										class="absolute top-1/2 h-5 -translate-y-1/2 rounded-md text-left text-[11px] leading-5 font-medium whitespace-nowrap text-white shadow-xs"
										:class="[
											row.colorClass,
											row.task.status === 'done' && 'opacity-50',
											row.issue && 'ring-error ring-2'
										]"
										:style="{ left: `${row.left}px`, width: `${row.width}px` }"
										:aria-label="row.tooltip"
										@click="emit('open', row.task.id)">
										<span
											v-if="row.width > 60"
											class="block truncate px-1.5">
											{{ row.task.title }}
										</span>
									</button>
								</UTooltip>
							</div>
						</div>
					</template>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	const LABEL_WIDTH = '15rem';

	const props = defineProps<{
		tasks: TaskView[];
		phases: PhaseView[];
		/** Pixels per day: the zoom level. */
		dayWidth: number;
	}>();

	const emit = defineEmits<{
		open: [id: string];
	}>();

	const { categories } = useLookups();
	const today = todayIso();

	const scheduled = computed(() => props.tasks.filter((task) => task.startDate || task.dueDate));
	const issues = computed(() => new Set(findDependencyIssues(scheduled.value).map((issue) => issue.taskId)));

	/** The visible range: every dated task and phase plus today, padded and snapped to whole weeks. */
	const range = computed(() => {
		const dates = [
			today,
			...scheduled.value.flatMap((task) => [task.startDate, task.dueDate]),
			...props.phases.flatMap((phase) => [phase.startDate, phase.endDate])
		].filter((date): date is string => Boolean(date));
		const sorted = [...dates].sort();
		const start = startOfWeek(addDays(sorted[0] ?? today, -7));
		const end = addDays(startOfWeek(addDays(sorted[sorted.length - 1] ?? today, 14)), 6);

		return { start, end, days: daysBetween(start, end) + 1 };
	});

	const weekWidth = computed(() => props.dayWidth * 7);
	const totalWidth = computed(() => range.value.days * props.dayWidth);
	const x = (date: string) => daysBetween(range.value.start, date) * props.dayWidth;

	const todayLeft = computed(() => (today >= range.value.start && today <= range.value.end ? x(today) : null));

	const weeks = computed(() => {
		const result: { start: string; left: number; label: string }[] = [];
		for (let start = range.value.start; start <= range.value.end; start = addDays(start, 7)) {
			result.push({ start, left: x(start), label: `W${isoWeek(start)}` });
		}

		return result;
	});

	const months = computed(() => {
		const result: { key: string; label: string; left: number; width: number }[] = [];
		let cursor = `${range.value.start.slice(0, 7)}-01`;
		while (cursor <= range.value.end) {
			const next = nextMonth(cursor);
			const from = cursor < range.value.start ? range.value.start : cursor;
			const to = next > range.value.end ? addDays(range.value.end, 1) : next;
			result.push({
				key: cursor,
				label: capitalize(formatters.monthYear.format(toDate(cursor))),
				left: x(from),
				width: daysBetween(from, to) * props.dayWidth
			});
			cursor = next;
		}

		return result;
	});

	const milestones = computed(() =>
		props.phases
			.filter((phase) => phase.isMilestone && phase.startDate)
			.map((phase) => ({
				id: phase.id,
				name: phase.name,
				date: phase.startDate as string,
				left: x(phase.startDate as string)
			}))
	);

	function toRow(task: TaskView) {
		const start = task.startDate ?? (task.dueDate as string);
		const end = task.dueDate && task.dueDate >= start ? task.dueDate : start;
		const category = task.categoryId ? categories.value.get(task.categoryId) : undefined;
		const dates = start === end ? formatDate(start) : `${formatDate(start, 'dayMonth')} – ${formatDate(end)}`;

		return {
			task,
			left: x(start),
			width: Math.max((daysBetween(start, end) + 1) * props.dayWidth, 8),
			colorClass: `bg-${category?.color ?? 'stone'}-500`,
			issue: issues.value.has(task.id),
			tooltip: [task.title, dates, issues.value.has(task.id) ? 'Start vóór een taak waarop ze wacht' : '']
				.filter(Boolean)
				.join(' · ')
		};
	}

	const groups = computed(() => {
		const phaseGroups = props.phases
			.filter((phase) => !phase.isMilestone)
			.map((phase) => ({
				id: phase.id,
				name: phase.name,
				bar:
					phase.startDate && phase.endDate
						? { left: x(phase.startDate), width: (daysBetween(phase.startDate, phase.endDate) + 1) * props.dayWidth }
						: null,
				rows: scheduled.value.filter((task) => task.phaseId === phase.id).map(toRow)
			}));
		const known = new Set(phaseGroups.map((group) => group.id));
		const loose = scheduled.value.filter((task) => !task.phaseId || !known.has(task.phaseId)).map(toRow);

		return [
			...phaseGroups,
			...(loose.length ? [{ id: 'none', name: 'Zonder fase', bar: null, rows: loose }] : [])
		].filter((group) => group.rows.length > 0 || group.bar);
	});

	function capitalize(text: string): string {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	function nextMonth(firstOfMonth: string): string {
		const [year, month] = firstOfMonth.split('-').map(Number);
		const nextYear = month === 12 ? (year ?? 0) + 1 : (year ?? 0);
		const nextMonthNumber = month === 12 ? 1 : (month ?? 0) + 1;

		return `${nextYear}-${String(nextMonthNumber).padStart(2, '0')}-01`;
	}

	/** ISO 8601 week number. */
	function isoWeek(isoDate: string): number {
		const thursday = addDays(startOfWeek(isoDate), 3);
		const firstThursday = addDays(startOfWeek(`${thursday.slice(0, 4)}-01-04`), 3);

		return Math.round(daysBetween(firstThursday, thursday) / 7) + 1;
	}
</script>

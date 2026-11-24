<template>
	<CPage
		id="tasks"
		title="Taken"
		wide>
		<template #actions>
			<UButton
				v-if="internal"
				icon="i-lucide-plus"
				label="Nieuwe taak"
				@click="openCreate()" />
		</template>

		<template #toolbar>
			<div class="flex w-full flex-wrap items-center gap-2 py-1">
				<UInput
					v-model="search"
					icon="i-lucide-search"
					placeholder="Zoek…"
					class="w-full sm:w-56" />
				<USelectMenu
					v-model="filters.categoryId"
					:items="categoryOptions"
					valueKey="value"
					placeholder="Werkpost"
					clear
					class="w-40" />
				<USelectMenu
					v-model="filters.roomId"
					:items="roomOptions"
					valueKey="value"
					placeholder="Ruimte"
					clear
					class="w-36" />
				<USelectMenu
					v-if="internal"
					v-model="filters.phaseId"
					:items="phaseOptions"
					valueKey="value"
					placeholder="Fase"
					clear
					class="w-40" />
				<USwitch
					v-model="hideDone"
					label="Verberg klaar"
					class="ml-1" />
				<UTabs
					v-model="view"
					:items="viewItems"
					:content="false"
					size="xs"
					class="ml-auto w-48" />
			</div>
		</template>

		<form
			v-if="internal"
			class="flex gap-2"
			@submit.prevent="quickAdd">
			<UInput
				v-model="quickTitle"
				icon="i-lucide-plus"
				placeholder="Snel een taak toevoegen en Enter drukken…"
				class="flex-1" />
			<UButton
				type="submit"
				label="Voeg toe"
				color="neutral"
				variant="outline"
				:disabled="!quickTitle.trim()"
				:loading="quickPending" />
		</form>

		<UEmpty
			v-if="status !== 'pending' && tasks.length === 0"
			icon="i-lucide-list-checks"
			:title="internal ? 'Nog geen taken' : 'Er zijn nog geen taken aan jou toegewezen'"
			:actions="
				internal ? [{ label: 'Eerste taak toevoegen', icon: 'i-lucide-plus', onClick: () => openCreate() }] : []
			" />

		<CKanban
			v-else-if="view === 'board'"
			:tasks="filtered"
			:statusById="statusById"
			@open="openTask"
			@move="move" />

		<UTable
			v-else
			:data="filtered"
			:columns="columns"
			:loading="status === 'pending'"
			class="border-default rounded-lg border"
			@select="(_event, row) => openTask(row.original.id)" />

		<CTaskSlideover
			:taskId="selectedId"
			@close="closeTask"
			@changed="refresh" />
	</CPage>
</template>

<script setup lang="ts">
	import type { TableColumn } from '@nuxt/ui';

	import { CTaskCreateModal } from '#components';

	const UBadge = resolveComponent('UBadge');
	const UCheckbox = resolveComponent('UCheckbox');
	const CTaskMeta = resolveComponent('CTaskMeta');

	const route = useRoute();
	const router = useRouter();
	const { user } = useUserSession();
	const internal = computed(() => isInternal(user.value));
	const { tasks, refresh, status, statusById } = useTasks();
	const { categoryOptions, roomOptions, phaseOptions, phases } = useLookups();

	const view = useLocalStorage<'board' | 'list'>('tasks-view', 'board');
	const viewItems = [
		{ label: 'Bord', value: 'board', icon: 'i-lucide-kanban' },
		{ label: 'Lijst', value: 'list', icon: 'i-lucide-list' }
	];
	const search = ref('');
	const hideDone = useLocalStorage('tasks-hide-done', false);
	const filters = reactive<{ categoryId?: string; roomId?: string; phaseId?: string }>({});

	const filtered = computed(() => {
		const query = search.value.trim().toLowerCase();

		return tasks.value.filter(
			(task) =>
				(!query || task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query)) &&
				(!filters.categoryId || task.categoryId === filters.categoryId) &&
				(!filters.roomId || task.roomId === filters.roomId) &&
				(!filters.phaseId || task.phaseId === filters.phaseId) &&
				(!hideDone.value || task.status !== 'done')
		);
	});

	// The open task lives in the URL, so a link from search or the overview opens it directly.
	const selectedId = computed(() => (typeof route.query.taak === 'string' ? route.query.taak : null));
	const openTask = (id: string) => router.push({ query: { ...route.query, taak: id } });
	const closeTask = () => router.push({ query: { ...route.query, taak: undefined } });

	const createModal = useOverlay().create(CTaskCreateModal);
	async function openCreate(initial = {}) {
		const task = await createModal.open({ initial }).result;
		if (task) await refresh();
	}

	// The app's home-screen shortcut "Nieuwe taak" lands on /taken?nieuw=1.
	onMounted(() => {
		if (route.query.nieuw === undefined || !internal.value) return;
		void router.replace({ query: { ...route.query, nieuw: undefined } });
		void openCreate();
	});

	const quickTitle = ref('');
	const { run: quickAdd, pending: quickPending } = useAction(
		() =>
			$fetch<TaskView>('/api/tasks', {
				method: 'POST',
				body: {
					title: quickTitle.value,
					categoryId: filters.categoryId,
					roomId: filters.roomId,
					phaseId: filters.phaseId
				}
			}),
		{
			onSuccess: async () => {
				quickTitle.value = '';
				await refresh();
			}
		}
	);

	const showError = useApiError();
	async function move({ status, orderedIds }: { status: TaskStatus; orderedIds: string[] }) {
		// Optimistic: reorder locally first so the card doesn't jump back while the request runs.
		const order = new Map(orderedIds.map((id, index) => [id, index + 1]));
		tasks.value = tasks.value
			.map((task) => (order.has(task.id) ? { ...task, status, sortOrder: order.get(task.id) ?? task.sortOrder } : task))
			.sort((a, b) => a.sortOrder - b.sortOrder);
		try {
			await $fetch('/api/tasks/move', { method: 'POST', body: { status, orderedIds } });
		} catch (error) {
			showError(error);
		}
		await refresh();
	}

	const { run: toggleDone } = useAction((task: TaskView) =>
		$fetch(`/api/tasks/${task.id}`, {
			method: 'PATCH',
			body: { status: task.status === 'done' ? 'todo' : 'done' }
		}).then(() => refresh())
	);

	const columns: TableColumn<TaskView>[] = [
		{
			id: 'done',
			header: '',
			cell: ({ row }) =>
				h(UCheckbox, {
					modelValue: row.original.status === 'done',
					'aria-label': 'Markeer als klaar',
					onClick: (event: Event) => event.stopPropagation(),
					'onUpdate:modelValue': () => toggleDone(row.original)
				}),
			meta: { class: { td: 'w-8' } }
		},
		{
			accessorKey: 'title',
			header: 'Taak',
			cell: ({ row }) =>
				h('div', { class: 'space-y-1' }, [
					h(
						'p',
						{ class: ['text-highlighted font-medium', row.original.status === 'done' && 'line-through text-muted'] },
						row.original.title
					),
					h(CTaskMeta, { task: row.original, blocked: isBlocked(row.original, statusById.value) })
				])
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const meta = TASK_STATUS_META[row.original.status];
				return h(UBadge, { label: meta.label, color: meta.color, variant: 'subtle', icon: meta.icon });
			}
		},
		{
			accessorKey: 'phaseId',
			header: 'Fase',
			cell: ({ row }) => (row.original.phaseId ? (phases.value.get(row.original.phaseId)?.name ?? '') : '')
		}
	];
</script>

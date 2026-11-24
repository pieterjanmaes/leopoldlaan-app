<template>
	<UPageCard
		:title="title"
		:description="description"
		variant="subtle"
		:ui="{ container: 'gap-y-3' }">
		<ul class="divide-default divide-y">
			<li
				v-for="(item, index) in items"
				:key="item.id"
				class="flex items-center gap-3 py-2">
				<CCategoryDot
					v-if="'color' in item"
					:color="item.color" />
				<UIcon
					v-if="'icon' in item"
					:name="item.icon"
					class="text-muted size-4" />
				<UIcon
					v-if="'isMilestone' in item && item.isMilestone"
					name="i-lucide-flag"
					class="text-primary size-4" />
				<span class="text-highlighted min-w-0 flex-1 truncate text-sm">{{ item.name }}</span>
				<span class="text-muted hidden text-xs sm:inline">{{ detail(item) }}</span>
				<UButton
					icon="i-lucide-arrow-up"
					color="neutral"
					variant="ghost"
					size="xs"
					aria-label="Hoger"
					:disabled="index === 0"
					@click="swap(index, index - 1)" />
				<UButton
					icon="i-lucide-pencil"
					color="neutral"
					variant="ghost"
					size="xs"
					aria-label="Bewerk"
					@click="edit(item)" />
				<UButton
					icon="i-lucide-trash-2"
					color="neutral"
					variant="ghost"
					size="xs"
					aria-label="Verwijder"
					@click="remove(item)" />
			</li>
		</ul>
		<div>
			<UButton
				icon="i-lucide-plus"
				:label="addLabel"
				color="neutral"
				variant="outline"
				size="sm"
				@click="edit(null)" />
		</div>
	</UPageCard>
</template>

<script setup lang="ts">
	import { CCatalogModal } from '#components';

	import type { CatalogKind } from './CCatalogModal.vue';

	type CatalogItem = RoomView | CategoryView | PhaseView;

	const props = defineProps<{
		kind: CatalogKind;
		title: string;
		description?: string;
		addLabel: string;
		items: CatalogItem[];
	}>();

	const emit = defineEmits<{
		changed: [];
	}>();

	function detail(item: CatalogItem): string {
		if ('floor' in item) return item.floor ?? '';
		if ('startDate' in item && item.startDate) {
			return item.isMilestone || !item.endDate
				? formatDate(item.startDate)
				: `${formatDate(item.startDate, 'dayMonth')} – ${formatDate(item.endDate)}`;
		}

		return '';
	}

	const modal = useOverlay().create(CCatalogModal);
	async function edit(item: CatalogItem | null) {
		if (await modal.open({ kind: props.kind, item, sortOrder: props.items.length }).result) emit('changed');
	}

	// Renumber the whole list, so older items without a distinct sort order end up consistent too.
	const { run: swap } = useAction(
		async (from: number, to: number) => {
			const order = [...props.items];
			const [moved] = order.splice(from, 1);
			if (!moved) return;
			order.splice(to, 0, moved);
			await Promise.all(
				order
					.map((item, index) => ({ item, index }))
					.filter(({ item, index }) => item.sortOrder !== index)
					.map(({ item, index }) =>
						$fetch(`/api/${props.kind}/${item.id}`, { method: 'PATCH', body: { sortOrder: index } })
					)
			);
		},
		{ onSuccess: () => emit('changed') }
	);

	const { run: remove } = useAction(
		(item: CatalogItem) => $fetch(`/api/${props.kind}/${item.id}`, { method: 'DELETE' }),
		{
			confirm: (item) => ({
				title: `"${item.name}" verwijderen?`,
				label: 'Verwijder'
			}),
			success: 'Verwijderd',
			onSuccess: () => emit('changed')
		}
	);
</script>

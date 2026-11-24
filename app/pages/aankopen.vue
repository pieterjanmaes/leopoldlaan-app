<template>
	<CPage
		id="purchases"
		title="Aankopen">
		<template #actions>
			<UButton
				icon="i-lucide-plus"
				label="Aankoop"
				@click="edit(null)" />
		</template>

		<template #toolbar>
			<div class="flex w-full flex-wrap items-center gap-2 py-1">
				<UTabs
					v-model="tab"
					:items="tabs"
					:content="false"
					size="xs"
					class="w-full sm:w-auto" />
				<UInput
					v-model="search"
					icon="i-lucide-search"
					placeholder="Zoek…"
					class="w-full sm:w-48" />
				<USelect
					v-model="groupBy"
					:items="groupOptions"
					class="w-40"
					aria-label="Groepeer per" />
			</div>
		</template>

		<form
			class="flex gap-2"
			@submit.prevent="quickAdd">
			<UInput
				v-model="quickText"
				icon="i-lucide-plus"
				placeholder="Bv. 12 m² vloertegels, 3 zakken tegellijm, stopcontacten…"
				class="flex-1" />
			<UButton
				type="submit"
				label="Voeg toe"
				color="neutral"
				variant="outline"
				:disabled="!quickText.trim()"
				:loading="quickPending" />
		</form>

		<UAlert
			v-if="urgent.length"
			icon="i-lucide-alarm-clock"
			color="warning"
			variant="subtle"
			:title="`${urgent.length} ${urgent.length === 1 ? 'aankoop moet' : 'aankopen moeten'} besteld worden`"
			:description="`Nodig op de werf binnen ${ORDER_WARNING_DAYS} dagen (of al te laat): ${urgent.map((item) => item.name).join(', ')}.`" />

		<UEmpty
			v-if="filtered.length === 0"
			icon="i-lucide-shopping-cart"
			:title="materials.length ? 'Niets in deze lijst' : 'Nog niets te kopen'"
			:description="
				materials.length
					? undefined
					: 'Zet hier alles wat gekocht of besteld moet worden, per ruimte. Koppel het aan een taak, dan zie je op tijd wat je moet bestellen.'
			" />

		<UCard
			v-for="group in groups"
			v-else
			:key="group.key"
			:ui="{ body: 'p-0 sm:p-0' }">
			<template #header>
				<div class="flex items-center justify-between gap-3">
					<h2 class="text-highlighted flex min-w-0 items-center gap-2 font-semibold">
						<CCategoryDot
							v-if="group.color"
							:color="group.color" />
						<span class="truncate">{{ group.label }}</span>
						<UBadge
							:label="String(group.items.length)"
							color="neutral"
							variant="subtle"
							size="sm" />
					</h2>
					<span
						v-if="group.totalCents"
						class="text-muted shrink-0 text-sm tabular-nums">
						{{ formatPrice(group.totalCents) }}
					</span>
				</div>
			</template>

			<ul class="divide-default divide-y">
				<li
					v-for="item in group.items"
					:key="item.id"
					class="flex items-center gap-3 px-4 py-2.5">
					<UCheckbox
						v-if="canInvoice(item)"
						:modelValue="selected.has(item.id)"
						:aria-label="`Selecteer ${item.name} voor een factuur`"
						@update:model-value="toggleSelected(item.id)" />
					<span
						v-else
						class="w-4 shrink-0" />
					<UTooltip :text="nextStatusLabel(item)">
						<UButton
							:icon="MATERIAL_STATUS_META[item.status].icon"
							:color="MATERIAL_STATUS_META[item.status].color"
							variant="soft"
							size="sm"
							:aria-label="nextStatusLabel(item)"
							:loading="isAdvancing(item.id)"
							@click="advance(item)" />
					</UTooltip>
					<button
						type="button"
						class="min-w-0 flex-1 text-left"
						@click="edit(item)">
						<span class="flex flex-wrap items-baseline gap-x-2">
							<span
								class="text-highlighted font-medium"
								:class="{ 'text-muted line-through': item.status === 'delivered' }">
								{{ item.name }}
							</span>
							<span class="text-muted text-sm tabular-nums">{{ formatQuantity(item) }}</span>
						</span>
						<span class="text-muted mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
							<span
								v-if="neededLabel(item)"
								:class="{ 'text-error font-medium': needsOrdering(item, today) }">
								{{ neededLabel(item) }}
							</span>
							<span v-if="groupBy !== 'contact' && item.contactId">{{ contacts.get(item.contactId)?.name }}</span>
							<span v-if="groupBy !== 'room' && item.roomId">{{ rooms.get(item.roomId)?.name }}</span>
							<span
								v-if="item.expenseId"
								class="flex items-center gap-1">
								<UIcon
									name="i-lucide-receipt"
									class="size-3.5" />
								op factuur
							</span>
						</span>
					</button>
					<span
						v-if="item.totalCents !== null"
						class="text-default shrink-0 text-sm tabular-nums">
						{{ formatPrice(item.totalCents) }}
					</span>
					<UButton
						v-if="item.url"
						:to="item.url"
						target="_blank"
						icon="i-lucide-external-link"
						color="neutral"
						variant="ghost"
						size="sm"
						aria-label="Open product" />
				</li>
			</ul>
		</UCard>

		<!-- Booking a receipt: pick the items that are on it. Sits above the phone's bottom bar. -->
		<div
			v-if="selected.size"
			class="bg-default border-default fixed inset-x-4 bottom-24 z-40 flex items-center gap-3 rounded-xl border p-3 shadow-lg lg:static lg:inset-auto">
			<span class="min-w-0 flex-1 text-sm">
				<span class="text-highlighted font-medium">{{ selected.size }} geselecteerd</span>
				<span class="text-muted"> · {{ formatPrice(selectedTotal) }}</span>
			</span>
			<UButton
				label="Wis"
				color="neutral"
				variant="ghost"
				@click="selected = new Set()" />
			<UButton
				icon="i-lucide-receipt"
				label="Maak factuur"
				:loading="invoicing"
				@click="makeInvoice" />
		</div>
	</CPage>
</template>

<script setup lang="ts">
	import { CMaterialModal } from '#components';

	definePageMeta({ middleware: 'internal' });

	type GroupBy = 'room' | 'contact' | 'category';

	const route = useRoute();
	const { materials, refresh } = useMaterials();
	const { rooms, contacts, categories } = useLookups();
	const today = todayIso();

	const tab = ref<MaterialStatus | 'all'>('needed');
	const search = ref('');
	const groupBy = useLocalStorage<GroupBy>('purchases-group', 'room');
	const groupOptions = [
		{ label: 'Per ruimte', value: 'room' },
		{ label: 'Per winkel', value: 'contact' },
		{ label: 'Per werkpost', value: 'category' }
	];

	const count = (status: MaterialStatus) => materials.value.filter((item) => item.status === status).length;
	const tabs = computed(() => [
		...MATERIAL_STATUSES.map((status) => ({
			label: MATERIAL_STATUS_META[status].label,
			value: status,
			badge: status === 'delivered' ? undefined : count(status) || undefined
		})),
		{ label: 'Alles', value: 'all' }
	]);

	const urgent = computed(() => materials.value.filter((item) => needsOrdering(item, today)));

	const filtered = computed(() => {
		const query = search.value.trim().toLowerCase();
		const roomFilter = typeof route.query.ruimte === 'string' ? route.query.ruimte : undefined;

		return materials.value.filter(
			(item) =>
				(tab.value === 'all' || item.status === tab.value) &&
				(!roomFilter || item.roomId === roomFilter) &&
				(!query || [item.name, item.notes].some((text) => text?.toLowerCase().includes(query)))
		);
	});

	function groupKey(item: MaterialView): string | null {
		if (groupBy.value === 'room') return item.roomId;
		if (groupBy.value === 'contact') return item.contactId;

		return item.categoryId;
	}

	function groupLabel(key: string | null): { label: string; color?: CategoryColor; sortOrder: number } {
		const none = { room: 'Zonder ruimte', contact: 'Zonder winkel', category: 'Zonder werkpost' }[groupBy.value];
		if (!key) return { label: none, sortOrder: Number.MAX_SAFE_INTEGER };
		if (groupBy.value === 'room') {
			const room = rooms.value.get(key);
			return { label: room?.name ?? none, sortOrder: room?.sortOrder ?? 0 };
		}
		if (groupBy.value === 'contact') return { label: contacts.value.get(key)?.name ?? none, sortOrder: 0 };
		const category = categories.value.get(key);

		return { label: category?.name ?? none, color: category?.color, sortOrder: category?.sortOrder ?? 0 };
	}

	const groups = computed(() => {
		const map = new Map<string | null, MaterialView[]>();
		for (const item of filtered.value) {
			const key = groupKey(item);
			map.set(key, [...(map.get(key) ?? []), item]);
		}

		return [...map.entries()]
			.map(([key, items]) => ({
				key: key ?? 'none',
				...groupLabel(key),
				items,
				totalCents: items.reduce((sum, item) => sum + (item.totalCents ?? 0), 0)
			}))
			.sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
	});

	const quantityFormatter = new Intl.NumberFormat('nl-BE', { maximumFractionDigits: 2 });
	function formatQuantity(item: MaterialView): string {
		return `${quantityFormatter.format(item.quantity)} ${item.unit}`;
	}

	function neededLabel(item: MaterialView): string {
		if (item.status === 'delivered')
			return item.deliveredOn ? `geleverd ${formatDate(item.deliveredOn, 'dayMonth')}` : '';
		if (item.status === 'ordered') {
			return item.effectiveNeededBy ? `besteld, nodig ${dueLabel(item.effectiveNeededBy, today)}` : 'besteld';
		}

		return item.effectiveNeededBy ? `nodig ${dueLabel(item.effectiveNeededBy, today)}` : '';
	}

	const NEXT_STATUS: Record<MaterialStatus, MaterialStatus> = {
		needed: 'ordered',
		ordered: 'delivered',
		delivered: 'needed'
	};
	function nextStatusLabel(item: MaterialView): string {
		return {
			needed: 'Markeer als besteld',
			ordered: 'Markeer als geleverd',
			delivered: 'Terug naar te kopen'
		}[item.status];
	}

	const { run: advance, isPending: isAdvancing } = useKeyedAction(
		([item]) => item.id,
		(item: MaterialView) =>
			$fetch(`/api/materials/${item.id}`, { method: 'PATCH', body: { status: NEXT_STATUS[item.status] } }),
		{ onSuccess: () => refresh() }
	);

	const quickText = ref('');
	const { run: quickAdd, pending: quickPending } = useAction(
		() => $fetch('/api/materials', { method: 'POST', body: parseQuickMaterial(quickText.value) }),
		{
			onSuccess: async () => {
				quickText.value = '';
				tab.value = 'needed';
				await refresh();
			}
		}
	);

	// Selecting items for one receipt
	const selected = ref(new Set<string>());
	const canInvoice = (item: MaterialView) => !item.expenseId && item.unitPriceCents !== null;
	function toggleSelected(id: string) {
		const next = new Set(selected.value);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected.value = next;
	}
	const selectedTotal = computed(() =>
		materials.value.filter((item) => selected.value.has(item.id)).reduce((sum, item) => sum + (item.totalCents ?? 0), 0)
	);

	const { run: makeInvoice, pending: invoicing } = useAction(
		() => $fetch<ExpenseView>('/api/materials/invoice', { method: 'POST', body: { materialIds: [...selected.value] } }),
		{
			confirm: () => ({
				title: `Eén factuur van ${formatPrice(selectedTotal.value)} maken voor ${selected.value.size} aankopen? Je vindt ze daarna bij Budget → Facturen.`,
				label: 'Maak factuur'
			}),
			success: 'Factuur aangemaakt bij Budget → Facturen',
			onSuccess: async () => {
				selected.value = new Set();
				await Promise.all([refresh(), refreshNuxtData('budget')]);
			}
		}
	);

	const modal = useOverlay().create(CMaterialModal);
	async function edit(material: MaterialView | null) {
		const roomFilter = typeof route.query.ruimte === 'string' ? route.query.ruimte : null;
		if (await modal.open({ material, initial: material ? undefined : { roomId: roomFilter } }).result) await refresh();
	}
</script>

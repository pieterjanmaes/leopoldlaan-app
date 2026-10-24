<template>
	<CPage
		id="decisions"
		title="Beslissingen">
		<template #actions>
			<UButton
				icon="i-lucide-plus"
				label="Beslissing"
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
					class="w-full sm:w-52" />
				<USelectMenu
					v-model="roomId"
					:items="roomOptions"
					valueKey="value"
					placeholder="Ruimte"
					clear
					class="w-36" />
				<USelectMenu
					v-model="categoryId"
					:items="categoryOptions"
					valueKey="value"
					placeholder="Werkpost"
					clear
					class="w-40" />
			</div>
		</template>

		<UEmpty
			v-if="filtered.length === 0"
			icon="i-lucide-scale"
			:title="decisions.length ? 'Niets gevonden' : 'Nog geen beslissingen'"
			:description="
				decisions.length
					? undefined
					: 'Noteer wat er nog gekozen moet worden (tegels, verwarming, keuken…) en wat er beslist is, met de reden. Handig bij discussies achteraf en om iets later opnieuw te bestellen.'
			"
			:actions="
				decisions.length ? [] : [{ label: 'Eerste beslissing', icon: 'i-lucide-plus', onClick: () => edit(null) }]
			" />

		<template v-else>
			<section
				v-for="group in groups"
				:key="group.status"
				class="space-y-2">
				<CSectionHeading
					v-if="tab === 'all'"
					:title="`${DECISION_STATUS_META[group.status].label} (${group.items.length})`" />
				<CDecisionCard
					v-for="decision in group.items"
					:key="decision.id"
					:decision="decision"
					@open="edit" />
			</section>
		</template>
	</CPage>
</template>

<script setup lang="ts">
	import { CDecisionModal } from '#components';

	definePageMeta({ middleware: 'internal' });

	const route = useRoute();
	const router = useRouter();
	const { decisions, refresh } = useDecisions();
	const { roomOptions, categoryOptions } = useLookups();

	const tab = ref<'open' | 'decided' | 'all'>('open');
	const search = ref('');
	const roomId = ref<string | undefined>(typeof route.query.ruimte === 'string' ? route.query.ruimte : undefined);
	const categoryId = ref<string | undefined>();

	const count = (status: DecisionStatus) => decisions.value.filter((decision) => decision.status === status).length;
	const tabs = computed(() => [
		{ label: 'Te beslissen', value: 'open', badge: count('open') || undefined },
		{ label: 'Beslist', value: 'decided' },
		{ label: 'Alles', value: 'all' }
	]);

	const filtered = computed(() => {
		const query = search.value.trim().toLowerCase();

		return decisions.value.filter(
			(decision) =>
				(tab.value === 'all' || decision.status === tab.value) &&
				(!roomId.value || decision.roomId === roomId.value) &&
				(!categoryId.value || decision.categoryId === categoryId.value) &&
				(!query ||
					[decision.title, decision.body, decision.reference].some((text) => text?.toLowerCase().includes(query)))
		);
	});

	// "Alles" shows a heading per status; the other tabs are one flat list. The API already sorts within a status.
	const groups = computed(() =>
		DECISION_STATUSES.map((status) => ({
			status,
			items: filtered.value.filter((decision) => decision.status === status)
		})).filter((group) => group.items.length > 0)
	);

	const modal = useOverlay().create(CDecisionModal);
	async function edit(decision: DecisionView | null) {
		const initial = decision ? undefined : { roomId: roomId.value ?? null, categoryId: categoryId.value ?? null };
		if (await modal.open({ decision, initial }).result) await refresh();
	}

	// Links from search and the overview: /beslissingen?beslissing=<id>
	watch(
		() => [route.query.beslissing, decisions.value.length] as const,
		async ([id]) => {
			const decision = typeof id === 'string' ? decisions.value.find((candidate) => candidate.id === id) : undefined;
			if (!decision) return;
			await router.replace({ query: { ...route.query, beslissing: undefined } });
			tab.value = decision.status === 'open' ? 'open' : 'all';
			await edit(decision);
		},
		{ immediate: true }
	);
</script>

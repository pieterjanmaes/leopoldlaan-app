<template>
	<CPage
		id="floor-plan"
		title="Grondplan"
		wide>
		<template #actions>
			<UButton
				icon="i-lucide-plus"
				label="Verdieping"
				color="neutral"
				variant="outline"
				@click="editPlan(null)" />
		</template>

		<UEmpty
			v-if="plans.length === 0"
			icon="i-lucide-map"
			title="Nog geen grondplan"
			description="Maak per verdieping een plan aan. Leg er een afbeelding onder (bv. uit openPlan3D of het plan van de architect) en duid ruimtes en aandachtspunten aan."
			:actions="emptyActions" />

		<template v-else>
			<div class="flex flex-wrap items-center gap-2">
				<UTabs
					v-model="activeId"
					:items="tabs"
					:content="false"
					variant="link"
					class="min-w-0 flex-1" />
				<UButton
					icon="i-lucide-settings-2"
					color="neutral"
					variant="ghost"
					aria-label="Verdieping bewerken"
					@click="editPlan(active)" />
				<UButton
					icon="i-lucide-trash-2"
					color="neutral"
					variant="ghost"
					aria-label="Verdieping verwijderen"
					@click="removePlan" />
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<UFieldGroup>
					<UButton
						v-for="tool in tools"
						:key="tool.value"
						:icon="tool.icon"
						:label="tool.label"
						:color="mode === tool.value ? 'primary' : 'neutral'"
						:variant="mode === tool.value ? 'solid' : 'outline'"
						@click="mode = tool.value" />
				</UFieldGroup>
				<p class="text-muted hidden text-sm sm:block">
					Scroll om te zoomen, sleep om te verschuiven. Pins kan je verslepen.
				</p>
			</div>

			<div
				v-if="active"
				class="grid gap-4 lg:grid-cols-[1fr_20rem]">
				<ClientOnly>
					<CFloorPlanCanvas
						:plan="active"
						:mode="mode"
						:selectedId="selectedId"
						:draftColor="DEFAULT_ZONE_COLOR"
						:roomNames="roomNames"
						@select="selectedId = $event"
						@create="createMarker"
						@move="moveMarker"
						@aspect="saveAspect" />
					<template #fallback>
						<USkeleton class="aspect-[1.41] w-full" />
					</template>
				</ClientOnly>

				<UCard :ui="{ body: 'p-4 sm:p-4' }">
					<CPlanMarkerPanel
						v-if="selected"
						:marker="selected"
						:saving="saving"
						@close="selectedId = null"
						@save="saveMarker"
						@delete="removeMarker" />

					<div
						v-else
						class="space-y-3">
						<h3 class="text-highlighted font-semibold">Aanduidingen</h3>
						<p
							v-if="!active.markers.length"
							class="text-muted text-sm">
							Kies <strong>Zone</strong> om een ruimte te omlijnen of <strong>Pin</strong> om een plek met een notitie
							aan te duiden.
						</p>
						<ul class="divide-default divide-y">
							<li
								v-for="item in markerList"
								:key="item.marker.id">
								<button
									type="button"
									class="hover:bg-elevated/50 -mx-2 flex w-full items-start gap-2 rounded-md px-2 py-2 text-left"
									@click="selectedId = item.marker.id">
									<span
										class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
										:style="{ backgroundColor: CATEGORY_HEX[item.marker.color] }">
										<UIcon
											v-if="item.marker.kind === 'zone'"
											name="i-lucide-pentagon"
											class="size-3" />
										<template v-else>{{ item.number }}</template>
									</span>
									<span class="min-w-0 flex-1">
										<span class="text-highlighted block truncate text-sm font-medium">{{ item.title }}</span>
										<span
											v-if="item.marker.note"
											class="text-muted line-clamp-2 text-xs">
											{{ item.marker.note }}
										</span>
									</span>
									<UIcon
										v-if="item.marker.taskId"
										name="i-lucide-list-checks"
										class="text-muted mt-0.5 size-4 shrink-0" />
								</button>
							</li>
						</ul>
					</div>
				</UCard>
			</div>
		</template>
	</CPage>
</template>

<script setup lang="ts">
	import { CFloorPlanModal } from '#components';
	import type { Point } from '#shared/utils/geometry';
	import type { PlanMode } from '~/components/CFloorPlanCanvas.vue';

	definePageMeta({ middleware: 'internal' });

	const DEFAULT_ZONE_COLOR: CategoryColor = 'sky';
	const DEFAULT_PIN_COLOR: CategoryColor = 'red';

	const { data: plans, refresh } = await useFetch<FloorPlanView[]>('/api/floor-plans', {
		key: 'floor-plans',
		default: () => []
	});
	const { lookups, rooms } = useLookups();
	const showError = useApiError();

	const activeId = useLocalStorage<string | undefined>('floor-plan-active', undefined);
	watch(
		plans,
		(list) => {
			if (!list.some((plan) => plan.id === activeId.value)) activeId.value = list[0]?.id;
		},
		{ immediate: true }
	);
	const active = computed(() => plans.value.find((plan) => plan.id === activeId.value));
	const tabs = computed(() => plans.value.map((plan) => ({ label: plan.name, value: plan.id })));

	const mode = ref<PlanMode>('select');
	const tools: { label: string; value: PlanMode; icon: string }[] = [
		{ label: 'Selecteer', value: 'select', icon: 'i-lucide-mouse-pointer-2' },
		{ label: 'Zone', value: 'zone', icon: 'i-lucide-pentagon' },
		{ label: 'Pin', value: 'pin', icon: 'i-lucide-map-pin' }
	];

	const selectedId = ref<string | null>(null);
	watch(activeId, () => {
		selectedId.value = null;
	});
	const selected = computed(() => active.value?.markers.find((marker) => marker.id === selectedId.value) ?? null);

	const roomNames = computed(() => new Map([...rooms.value.values()].map((room) => [room.id, room.name])));

	const markerList = computed(() => {
		let pinNumber = 0;

		return (active.value?.markers ?? []).map((marker) => {
			const number = marker.kind === 'pin' ? ++pinNumber : 0;
			const roomName = marker.roomId ? roomNames.value.get(marker.roomId) : undefined;

			return {
				marker,
				number,
				title: marker.label || roomName || (marker.kind === 'pin' ? `Pin ${number}` : 'Zone zonder naam')
			};
		});
	});

	/** Applies a change to the cached plan right away, so the canvas doesn't wait for the server. */
	function patchActive(update: (plan: FloorPlanView) => FloorPlanView) {
		plans.value = plans.value.map((plan) => (plan.id === activeId.value ? update(plan) : plan));
	}

	async function createMarker({ kind, points }: { kind: PlanMarkerKind; points: Point[] }) {
		if (!active.value) return;
		try {
			const marker = await $fetch<PlanMarkerView>('/api/plan-markers', {
				method: 'POST',
				body: {
					floorPlanId: active.value.id,
					kind,
					points,
					color: kind === 'pin' ? DEFAULT_PIN_COLOR : DEFAULT_ZONE_COLOR
				}
			});
			patchActive((plan) => ({ ...plan, markers: [...plan.markers, marker] }));
			selectedId.value = marker.id;
			mode.value = 'select';
		} catch (error) {
			showError(error);
		}
	}

	async function moveMarker({ id, points }: { id: string; points: Point[] }) {
		patchActive((plan) => ({
			...plan,
			markers: plan.markers.map((marker) => (marker.id === id ? { ...marker, points } : marker))
		}));
		try {
			await $fetch(`/api/plan-markers/${id}`, { method: 'PATCH', body: { points } });
		} catch (error) {
			showError(error);
			await refresh();
		}
	}

	const { run: saveMarker, pending: saving } = useAction(
		(id: string, changes: Partial<PlanMarkerView>) =>
			$fetch<PlanMarkerView>(`/api/plan-markers/${id}`, { method: 'PATCH', body: changes }),
		{
			success: 'Bewaard',
			onSuccess: (marker) =>
				patchActive((plan) => ({
					...plan,
					markers: plan.markers.map((existing) => (existing.id === marker.id ? marker : existing))
				}))
		}
	);

	const { run: removeMarker } = useAction(
		(marker: PlanMarkerView) => $fetch(`/api/plan-markers/${marker.id}`, { method: 'DELETE' }),
		{
			confirm: () => ({ title: 'Deze aanduiding verwijderen?', label: 'Verwijder' }),
			onSuccess: (_result, marker) => {
				selectedId.value = null;
				patchActive((plan) => ({ ...plan, markers: plan.markers.filter((existing) => existing.id !== marker.id) }));
			}
		}
	);

	async function saveAspect(aspectRatio: number) {
		if (!active.value) return;
		patchActive((plan) => ({ ...plan, aspectRatio }));
		await $fetch(`/api/floor-plans/${active.value.id}`, { method: 'PATCH', body: { aspectRatio } }).catch(showError);
	}

	const planModal = useOverlay().create(CFloorPlanModal);
	async function editPlan(plan: FloorPlanView | null | undefined) {
		const saved = await planModal.open({ plan, sortOrder: plans.value.length }).result;
		if (saved) {
			await refresh();
			activeId.value = saved.id;
		}
	}

	const { run: removePlan } = useAction(() => $fetch(`/api/floor-plans/${active.value?.id}`, { method: 'DELETE' }), {
		confirm: () => ({
			title: `"${active.value?.name}" en alle aanduidingen verwijderen? Het plan zelf blijft in Drive.`,
			label: 'Verwijder'
		}),
		success: 'Verdieping verwijderd',
		onSuccess: () => refresh()
	});

	/** One plan per floor that the rooms already mention, so the first setup is a single click. */
	const { run: createFromRooms } = useAction(
		async () => {
			const floors = [
				...new Set(lookups.value.rooms.map((room) => room.floor).filter((floor): floor is string => Boolean(floor)))
			];
			for (const [index, name] of (floors.length ? floors : ['Gelijkvloers']).entries()) {
				await $fetch('/api/floor-plans', { method: 'POST', body: { name, sortOrder: index } });
			}
			await refresh();
		},
		{ success: 'Verdiepingen aangemaakt' }
	);

	const emptyActions = computed(() => [
		{ label: 'Verdiepingen uit de ruimtes', icon: 'i-lucide-layers', onClick: () => createFromRooms() },
		{
			label: 'Eén verdieping',
			icon: 'i-lucide-plus',
			color: 'neutral' as const,
			variant: 'outline' as const,
			onClick: () => editPlan(null)
		}
	]);
</script>

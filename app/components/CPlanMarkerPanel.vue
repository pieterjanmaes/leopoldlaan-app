<template>
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<UIcon
				:name="marker.kind === 'pin' ? 'i-lucide-map-pin' : 'i-lucide-pentagon'"
				class="size-5"
				:style="{ color: CATEGORY_HEX[state.color] }" />
			<h3 class="text-highlighted flex-1 font-semibold">{{ marker.kind === 'pin' ? 'Pin' : 'Zone' }}</h3>
			<UButton
				icon="i-lucide-x"
				color="neutral"
				variant="ghost"
				size="sm"
				aria-label="Sluit"
				@click="emit('close')" />
		</div>

		<UFormField label="Titel">
			<UInput
				v-model="state.label"
				:placeholder="marker.kind === 'zone' ? 'Leeg = naam van de ruimte' : 'Bv. extra stopcontact'"
				class="w-full" />
		</UFormField>

		<UFormField label="Ruimte">
			<USelectMenu
				v-model="state.roomId"
				:items="roomOptions"
				valueKey="value"
				placeholder="Geen"
				clear
				class="w-full" />
		</UFormField>

		<UFormField label="Gekoppelde taak">
			<div class="flex gap-2">
				<USelectMenu
					v-model="state.taskId"
					:items="taskOptions"
					valueKey="value"
					placeholder="Geen"
					clear
					class="min-w-0 flex-1" />
				<UButton
					v-if="state.taskId"
					:to="{ path: '/taken', query: { taak: state.taskId } }"
					icon="i-lucide-external-link"
					color="neutral"
					variant="outline"
					aria-label="Open taak" />
			</div>
		</UFormField>

		<UFormField label="Kleur">
			<div class="flex flex-wrap gap-1.5">
				<button
					v-for="color in CATEGORY_COLORS"
					:key="color"
					type="button"
					class="size-6 rounded-full ring-offset-2 ring-offset-(--ui-bg)"
					:class="state.color === color && 'ring-primary ring-2'"
					:style="{ backgroundColor: CATEGORY_HEX[color] }"
					:aria-label="color"
					:aria-pressed="state.color === color"
					@click="state.color = color" />
			</div>
		</UFormField>

		<UFormField label="Notitie">
			<UTextarea
				v-model="note"
				:rows="3"
				autoresize
				placeholder="Bv. hier komt de verdeelkast, 3 stopcontacten boven het werkblad…"
				class="w-full" />
		</UFormField>

		<div
			v-if="roomDecisions.length"
			class="space-y-1">
			<p class="text-muted text-xs font-semibold tracking-wide uppercase">Beslissingen in deze ruimte</p>
			<ul class="space-y-1">
				<li
					v-for="decision in roomDecisions"
					:key="decision.id">
					<NuxtLink
						:to="{ path: '/beslissingen', query: { beslissing: decision.id } }"
						class="hover:bg-elevated/50 -mx-2 flex items-start gap-2 rounded-md px-2 py-1 text-sm">
						<UIcon
							:name="DECISION_STATUS_META[decision.status].icon"
							class="mt-0.5 size-4 shrink-0"
							:class="decision.status === 'open' ? 'text-warning' : 'text-success'" />
						<span class="min-w-0">
							<span class="text-highlighted block truncate">{{ decision.title }}</span>
							<span
								v-if="decision.reference"
								class="text-muted block truncate text-xs">
								{{ decision.reference }}
							</span>
						</span>
					</NuxtLink>
				</li>
			</ul>
		</div>

		<div
			v-if="roomTasks.length"
			class="space-y-1">
			<p class="text-muted text-xs font-semibold tracking-wide uppercase">Open taken in deze ruimte</p>
			<CTaskList
				:tasks="roomTasks"
				empty="" />
		</div>

		<div class="flex items-center justify-between gap-2">
			<UButton
				icon="i-lucide-trash-2"
				label="Verwijder"
				color="error"
				variant="ghost"
				@click="emit('delete', marker)" />
			<UButton
				label="Bewaar"
				:loading="saving"
				@click="emit('save', marker.id, { ...state })" />
		</div>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps<{
		marker: PlanMarkerView;
		saving?: boolean;
	}>();

	const emit = defineEmits<{
		close: [];
		delete: [marker: PlanMarkerView];
		save: [id: string, changes: Pick<PlanMarkerView, 'label' | 'note' | 'color' | 'roomId' | 'taskId'>];
	}>();

	const { roomOptions } = useLookups();
	const { tasks } = useTasks();
	const { decisions } = useDecisions();

	function fromMarker(marker: PlanMarkerView) {
		return {
			label: marker.label,
			note: marker.note,
			color: marker.color,
			roomId: marker.roomId,
			taskId: marker.taskId
		};
	}

	const state = reactive(fromMarker(props.marker));
	watch(
		() => props.marker.id,
		() => Object.assign(state, fromMarker(props.marker))
	);
	const note = useNullableText(state, 'note');

	const taskOptions = computed(() => tasks.value.map((task) => ({ label: task.title, value: task.id })));
	const roomDecisions = computed(() =>
		state.roomId
			? decisions.value.filter((decision) => decision.roomId === state.roomId && decision.status !== 'replaced')
			: []
	);
	const roomTasks = computed(() =>
		state.roomId ? tasks.value.filter((task) => task.roomId === state.roomId && task.status !== 'done') : []
	);
</script>

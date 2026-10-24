<template>
	<UModal :title="`${item ? 'Bewerk' : 'Nieuw'}: ${KIND_LABELS[kind]}`">
		<template #body>
			<UForm
				:schema="schema"
				:state="state"
				class="space-y-4"
				@submit="save">
				<UFormField
					label="Naam"
					name="name"
					required>
					<UInput
						v-model="state.name"
						class="w-full"
						autofocus />
				</UFormField>

				<UFormField
					v-if="kind === 'rooms'"
					label="Verdieping"
					name="floor">
					<UInput
						v-model="floor"
						placeholder="Bv. gelijkvloers"
						class="w-full" />
				</UFormField>

				<template v-if="kind === 'categories'">
					<UFormField
						label="Kleur"
						name="color">
						<div class="flex flex-wrap gap-2">
							<button
								v-for="color in CATEGORY_COLORS"
								:key="color"
								type="button"
								class="size-7 rounded-full ring-offset-2 ring-offset-(--ui-bg)"
								:class="[`bg-${color}-500`, state.color === color && 'ring-primary ring-2']"
								:aria-label="color"
								:aria-pressed="state.color === color"
								@click="state.color = color" />
						</div>
					</UFormField>
					<UFormField
						label="Icoon"
						name="icon"
						description="Een Lucide-icoon, bv. i-lucide-zap">
						<UInput
							v-model="state.icon"
							:icon="state.icon || undefined"
							class="w-full" />
					</UFormField>
				</template>

				<template v-if="kind === 'phases'">
					<USwitch
						v-model="state.isMilestone"
						label="Mijlpaal (één dag, bv. keuring of verhuis)" />
					<div class="grid gap-4 sm:grid-cols-2">
						<UFormField
							:label="state.isMilestone ? 'Datum' : 'Start'"
							name="startDate">
							<CDateInput v-model="state.startDate" />
						</UFormField>
						<UFormField
							v-if="!state.isMilestone"
							label="Einde"
							name="endDate">
							<CDateInput v-model="state.endDate" />
						</UFormField>
					</div>
				</template>

				<CModalActions
					:loading="pending"
					@cancel="emit('close', false)" />
			</UForm>
		</template>
	</UModal>
</template>

<script setup lang="ts">
	import { categorySchema, phaseSchema, roomSchema } from '#shared/schemas/catalog';

	export type CatalogKind = 'rooms' | 'categories' | 'phases';
	type CatalogItem = RoomView | CategoryView | PhaseView;

	const KIND_LABELS: Record<CatalogKind, string> = { rooms: 'ruimte', categories: 'werkpost', phases: 'fase' };

	const props = defineProps<{
		kind: CatalogKind;
		item?: CatalogItem | null;
		sortOrder?: number;
	}>();

	const emit = defineEmits<{
		close: [saved: boolean];
	}>();

	useZodLocale();

	const schema = { rooms: roomSchema, categories: categorySchema, phases: phaseSchema }[props.kind];
	const item = props.item as Partial<RoomView & CategoryView & PhaseView> | null | undefined;
	const state = reactive({
		name: item?.name ?? '',
		floor: item?.floor ?? null,
		color: item?.color ?? 'stone',
		icon: item?.icon ?? 'i-lucide-hammer',
		startDate: item?.startDate ?? null,
		endDate: item?.endDate ?? null,
		isMilestone: item?.isMilestone ?? false,
		sortOrder: item?.sortOrder ?? props.sortOrder ?? 0
	});
	const floor = useNullableText(state, 'floor');

	function body() {
		const { name, sortOrder } = state;
		if (props.kind === 'rooms') return { name, sortOrder, floor: state.floor };
		if (props.kind === 'categories') return { name, sortOrder, color: state.color, icon: state.icon };

		return {
			name,
			sortOrder,
			isMilestone: state.isMilestone,
			startDate: state.startDate,
			endDate: state.isMilestone ? state.startDate : state.endDate
		};
	}

	const { run: save, pending } = useAction(
		() =>
			props.item
				? $fetch(`/api/${props.kind}/${props.item.id}`, { method: 'PATCH', body: body() })
				: $fetch(`/api/${props.kind}`, { method: 'POST', body: body() }),
		{ success: 'Bewaard', onSuccess: () => emit('close', true) }
	);
</script>

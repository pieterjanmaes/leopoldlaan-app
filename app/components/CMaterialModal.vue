<template>
	<UModal
		:title="material ? 'Aankoop bewerken' : 'Nieuwe aankoop'"
		:ui="{ content: 'sm:max-w-2xl' }">
		<template #body>
			<UForm
				:schema="materialSchema"
				:state="state"
				class="space-y-4"
				@submit="save">
				<UFormField
					label="Wat"
					name="name"
					required>
					<UInput
						v-model="state.name"
						placeholder="Bv. vloertegels 60×60"
						class="w-full"
						autofocus />
				</UFormField>

				<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<UFormField
						label="Aantal"
						name="quantity"
						required>
						<UInputNumber
							v-model="state.quantity"
							:min="0"
							:step="1"
							:formatOptions="{ maximumFractionDigits: 2 }"
							locale="nl-BE"
							class="w-full" />
					</UFormField>
					<UFormField
						label="Eenheid"
						name="unit">
						<USelect
							v-model="state.unit"
							:items="unitOptions"
							class="w-full" />
					</UFormField>
					<UFormField
						label="Prijs per eenheid"
						name="unitPriceCents"
						hint="incl. btw">
						<CPriceInput
							v-model="state.unitPriceCents"
							class="w-full" />
					</UFormField>
					<UFormField label="Totaal">
						<p class="text-highlighted flex h-8 items-center font-semibold tabular-nums">
							{{ total === null ? '—' : formatPrice(total) }}
						</p>
					</UFormField>
				</div>

				<UFormField
					label="Status"
					name="status">
					<UTabs
						v-model="state.status"
						:items="statusItems"
						:content="false"
						size="sm" />
				</UFormField>

				<div class="grid gap-4 sm:grid-cols-2">
					<UFormField
						label="Nodig op de werf op"
						name="neededBy"
						:description="taskStart ? `Leeg = start van de taak (${formatDate(taskStart)})` : undefined">
						<CDateInput v-model="state.neededBy" />
					</UFormField>
					<UFormField
						label="Winkel / leverancier"
						name="contactId">
						<USelectMenu
							v-model="state.contactId"
							:items="contactOptions"
							valueKey="value"
							placeholder="Geen"
							clear
							class="w-full" />
					</UFormField>
					<UFormField
						label="Ruimte"
						name="roomId">
						<USelectMenu
							v-model="state.roomId"
							:items="roomOptions"
							valueKey="value"
							placeholder="Geen"
							clear
							class="w-full" />
					</UFormField>
					<UFormField
						label="Werkpost"
						name="categoryId">
						<USelectMenu
							v-model="state.categoryId"
							:items="categoryOptions"
							valueKey="value"
							placeholder="Geen"
							clear
							class="w-full" />
					</UFormField>
					<UFormField
						label="Voor taak"
						name="taskId">
						<USelectMenu
							v-model="state.taskId"
							:items="taskOptions"
							valueKey="value"
							placeholder="Geen"
							clear
							class="w-full" />
					</UFormField>
					<UFormField
						label="Hoort bij beslissing"
						name="decisionId">
						<USelectMenu
							v-model="state.decisionId"
							:items="decisionOptions"
							valueKey="value"
							placeholder="Geen"
							clear
							class="w-full"
							@update:model-value="onDecisionChosen" />
					</UFormField>
				</div>

				<UFormField
					label="Link naar product"
					name="url">
					<UInput
						v-model="url"
						type="url"
						placeholder="https://…"
						class="w-full" />
				</UFormField>
				<UFormField
					label="Notities"
					name="notes">
					<UTextarea
						v-model="notes"
						autoresize
						class="w-full" />
				</UFormField>

				<UAlert
					v-if="material?.expenseId"
					icon="i-lucide-receipt"
					color="neutral"
					variant="subtle"
					title="Staat op een factuur"
					description="Deze aankoop telt in het budget als factuur, niet meer als verwachte aankoop." />

				<CModalActions
					:loading="pending"
					@cancel="emit('close', false)">
					<UButton
						v-if="material"
						label="Verwijder"
						icon="i-lucide-trash-2"
						color="error"
						variant="ghost"
						class="mr-auto"
						@click="remove" />
				</CModalActions>
			</UForm>
		</template>
	</UModal>
</template>

<script setup lang="ts">
	import type * as z from 'zod';

	import { materialSchema } from '#shared/schemas/materials';

	const props = defineProps<{
		material?: MaterialView | null;
		initial?: Partial<z.input<typeof materialSchema>>;
	}>();

	const emit = defineEmits<{
		close: [saved: boolean];
	}>();

	useZodLocale();
	const { categoryOptions, contactOptions, roomOptions } = useLookups();
	const { tasks, byId: taskById } = useTasks();
	const { decisions } = useDecisions();

	const state = reactive<z.input<typeof materialSchema>>({
		name: props.material?.name ?? '',
		quantity: props.material?.quantity ?? 1,
		unit: props.material?.unit ?? 'st',
		unitPriceCents: props.material?.unitPriceCents ?? null,
		status: props.material?.status ?? 'needed',
		neededBy: props.material?.neededBy ?? null,
		roomId: props.material?.roomId ?? null,
		categoryId: props.material?.categoryId ?? null,
		contactId: props.material?.contactId ?? null,
		taskId: props.material?.taskId ?? null,
		decisionId: props.material?.decisionId ?? null,
		url: props.material?.url ?? null,
		notes: props.material?.notes ?? null,
		...props.initial
	});
	const url = useNullableText(state, 'url');
	const notes = useNullableText(state, 'notes');

	const total = computed(() => materialTotalCents(state.quantity ?? 0, state.unitPriceCents));
	const taskStart = computed(() => (state.taskId ? (taskById.value.get(state.taskId)?.startDate ?? null) : null));

	const unitOptions = MATERIAL_UNITS.map((unit) => ({ label: unit, value: unit }));
	const statusItems = MATERIAL_STATUSES.map((status) => ({
		label: MATERIAL_STATUS_META[status].label,
		value: status,
		icon: MATERIAL_STATUS_META[status].icon
	}));
	const taskOptions = computed(() => tasks.value.map((task) => ({ label: task.title, value: task.id })));
	const decisionOptions = computed(() =>
		decisions.value
			.filter((decision) => decision.status !== 'replaced')
			.map((decision) => ({ label: decision.title, value: decision.id }))
	);

	/** A decision usually already knows the room, category and supplier of what's being bought. */
	function onDecisionChosen(decisionId: unknown) {
		const decision = decisions.value.find((candidate) => candidate.id === decisionId);
		if (!decision) return;
		state.roomId ??= decision.roomId;
		state.categoryId ??= decision.categoryId;
		state.contactId ??= decision.contactId;
		state.taskId ??= decision.taskId;
	}

	const { run: save, pending } = useAction(
		() =>
			props.material
				? $fetch(`/api/materials/${props.material.id}`, { method: 'PATCH', body: state })
				: $fetch('/api/materials', { method: 'POST', body: state }),
		{ success: 'Bewaard', onSuccess: () => emit('close', true) }
	);

	const { run: remove } = useAction(() => $fetch(`/api/materials/${props.material?.id}`, { method: 'DELETE' }), {
		confirm: () => ({ title: `"${props.material?.name}" verwijderen?`, label: 'Verwijder' }),
		success: 'Aankoop verwijderd',
		onSuccess: () => emit('close', true)
	});
</script>

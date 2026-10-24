<template>
	<UModal :title="line ? 'Budgetpost bewerken' : 'Nieuwe budgetpost'">
		<template #body>
			<UForm
				:schema="budgetLineSchema"
				:state="state"
				class="space-y-4"
				@submit="save">
				<UFormField
					label="Omschrijving"
					name="label"
					required>
					<UInput
						v-model="state.label"
						placeholder="Bv. badkamer volledig"
						class="w-full" />
				</UFormField>
				<div class="grid gap-4 sm:grid-cols-2">
					<UFormField
						label="Werkpost"
						name="categoryId">
						<USelectMenu
							v-model="state.categoryId"
							:items="categoryOptions"
							valueKey="value"
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
							clear
							class="w-full" />
					</UFormField>
				</div>
				<UFormField
					label="Gepland bedrag (incl. btw)"
					name="plannedCents"
					required>
					<CPriceInput
						v-model="state.plannedCents"
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
				<CModalActions
					:loading="pending"
					@cancel="emit('close', false)" />
			</UForm>
		</template>
	</UModal>
</template>

<script setup lang="ts">
	import type * as z from 'zod';

	import { budgetLineSchema } from '#shared/schemas/budget';

	const props = defineProps<{
		line?: BudgetLineView | null;
		categoryId?: string | null;
	}>();

	const emit = defineEmits<{
		close: [saved: boolean];
	}>();

	useZodLocale();
	const { categoryOptions, roomOptions } = useLookups();

	const state = reactive<z.input<typeof budgetLineSchema>>({
		label: props.line?.label ?? '',
		categoryId: props.line?.categoryId ?? props.categoryId ?? null,
		roomId: props.line?.roomId ?? null,
		plannedCents: props.line?.plannedCents ?? 0,
		notes: props.line?.notes ?? null
	});
	const notes = useNullableText(state, 'notes');

	const { run: save, pending } = useAction(
		() =>
			props.line
				? $fetch(`/api/budget-lines/${props.line.id}`, { method: 'PATCH', body: state })
				: $fetch('/api/budget-lines', { method: 'POST', body: state }),
		{ success: 'Bewaard', onSuccess: () => emit('close', true) }
	);
</script>

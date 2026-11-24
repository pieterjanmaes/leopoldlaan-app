<template>
	<UModal :title="subsidy ? 'Premie bewerken' : 'Nieuwe premie'">
		<template #body>
			<UForm
				:schema="subsidySchema"
				:state="state"
				class="space-y-4"
				@submit="save">
				<UFormField
					label="Naam"
					name="name"
					required>
					<UInput
						v-model="state.name"
						placeholder="Bv. Mijn VerbouwPremie – dakisolatie"
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
						label="Status"
						name="status">
						<USelect
							v-model="state.status"
							:items="statusOptions"
							class="w-full" />
					</UFormField>
					<UFormField
						label="Verwacht bedrag"
						name="expectedCents">
						<CPriceInput
							v-model="state.expectedCents"
							class="w-full" />
					</UFormField>
					<UFormField
						label="Ontvangen"
						name="receivedCents">
						<CPriceInput
							v-model="state.receivedCents"
							class="w-full" />
					</UFormField>
					<UFormField
						label="Aanvragen vóór"
						name="deadline">
						<CDateInput v-model="state.deadline" />
					</UFormField>
				</div>
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

	import { subsidySchema } from '#shared/schemas/budget';

	const props = defineProps<{
		subsidy?: SubsidyView | null;
	}>();

	const emit = defineEmits<{
		close: [saved: boolean];
	}>();

	useZodLocale();
	const { categoryOptions } = useLookups();

	const state = reactive<z.input<typeof subsidySchema>>({
		name: props.subsidy?.name ?? '',
		categoryId: props.subsidy?.categoryId ?? null,
		expectedCents: props.subsidy?.expectedCents ?? 0,
		receivedCents: props.subsidy?.receivedCents ?? 0,
		status: props.subsidy?.status ?? 'planned',
		deadline: props.subsidy?.deadline ?? null,
		notes: props.subsidy?.notes ?? null
	});
	const notes = useNullableText(state, 'notes');
	const statusOptions = SUBSIDY_STATUSES.map((status) => ({ label: SUBSIDY_STATUS_META[status].label, value: status }));

	const { run: save, pending } = useAction(
		() =>
			props.subsidy
				? $fetch(`/api/subsidies/${props.subsidy.id}`, { method: 'PATCH', body: state })
				: $fetch('/api/subsidies', { method: 'POST', body: state }),
		{ success: 'Bewaard', onSuccess: () => emit('close', true) }
	);
</script>

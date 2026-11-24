<template>
	<UModal
		:title="quote ? 'Offerte bewerken' : 'Nieuwe offerte'"
		:ui="{ content: 'sm:max-w-2xl' }">
		<template #body>
			<UForm
				:schema="quoteSchema"
				:state="state"
				class="space-y-4"
				@submit="save">
				<UFormField
					label="Omschrijving"
					name="title"
					required>
					<UInput
						v-model="state.title"
						placeholder="Bv. dakwerken incl. isolatie"
						class="w-full" />
				</UFormField>
				<div class="grid gap-4 sm:grid-cols-2">
					<UFormField
						label="Aannemer / leverancier"
						name="contactId">
						<USelectMenu
							v-model="state.contactId"
							:items="contactOptions"
							valueKey="value"
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
							clear
							class="w-full" />
					</UFormField>
					<UFormField
						label="Bedrag excl. btw"
						name="amountExclCents"
						required>
						<CPriceInput
							v-model="state.amountExclCents"
							class="w-full" />
					</UFormField>
					<UFormField
						label="Btw"
						name="vatRate"
						:hint="formatPrice(inclVatCents(state.amountExclCents ?? 0, state.vatRate ?? 0)) + ' incl.'">
						<USelect
							v-model="state.vatRate"
							:items="vatOptions"
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
						label="Ontvangen op"
						name="receivedOn">
						<CDateInput v-model="state.receivedOn" />
					</UFormField>
					<UFormField
						label="Geldig tot"
						name="validUntil">
						<CDateInput v-model="state.validUntil" />
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
			<template v-if="quote">
				<USeparator class="my-6" />
				<h3 class="text-highlighted mb-3 font-semibold">Offerte-documenten</h3>
				<CAttachments
					entityType="quote"
					:entityId="quote.id" />
			</template>
		</template>
	</UModal>
</template>

<script setup lang="ts">
	import type * as z from 'zod';

	import { quoteSchema } from '#shared/schemas/budget';

	const props = defineProps<{
		quote?: QuoteView | null;
	}>();

	const emit = defineEmits<{
		close: [saved: boolean];
	}>();

	useZodLocale();
	const { categoryOptions, contactOptions } = useLookups();

	const state = reactive<z.input<typeof quoteSchema>>({
		title: props.quote?.title ?? '',
		contactId: props.quote?.contactId ?? null,
		categoryId: props.quote?.categoryId ?? null,
		amountExclCents: props.quote?.amountExclCents ?? 0,
		vatRate: props.quote?.vatRate ?? DEFAULT_VAT_RATE,
		status: props.quote?.status ?? 'received',
		receivedOn: props.quote?.receivedOn ?? todayIso(),
		validUntil: props.quote?.validUntil ?? null,
		notes: props.quote?.notes ?? null
	});
	const notes = useNullableText(state, 'notes');

	const vatOptions = VAT_RATES.map((rate) => ({ label: `${rate}%`, value: rate }));
	const statusOptions = QUOTE_STATUSES.map((status) => ({ label: QUOTE_STATUS_META[status].label, value: status }));

	const { run: save, pending } = useAction(
		() =>
			props.quote
				? $fetch(`/api/quotes/${props.quote.id}`, { method: 'PATCH', body: state })
				: $fetch('/api/quotes', { method: 'POST', body: state }),
		{ success: 'Bewaard', onSuccess: () => emit('close', true) }
	);
</script>

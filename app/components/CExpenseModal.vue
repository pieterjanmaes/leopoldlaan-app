<template>
	<UModal
		:title="expense ? 'Factuur bewerken' : 'Nieuwe factuur / uitgave'"
		:ui="{ content: 'sm:max-w-2xl' }">
		<template #body>
			<UForm
				:schema="expenseSchema"
				:state="state"
				class="space-y-4"
				@submit="save">
				<UFormField
					label="Omschrijving"
					name="description"
					required>
					<UInput
						v-model="state.description"
						placeholder="Bv. voorschot dakwerken"
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
						label="Hoort bij offerte"
						name="quoteId">
						<USelectMenu
							v-model="state.quoteId"
							:items="quoteOptions"
							valueKey="value"
							clear
							class="w-full"
							@update:model-value="onQuoteChosen" />
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
						label="Ruimte"
						name="roomId">
						<USelectMenu
							v-model="state.roomId"
							:items="roomOptions"
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
							class="w-full"
							@update:model-value="syncIncl" />
					</UFormField>
					<UFormField
						label="Btw"
						name="vatRate">
						<USelect
							v-model="state.vatRate"
							:items="vatOptions"
							class="w-full"
							@update:model-value="syncIncl" />
					</UFormField>
					<UFormField
						label="Totaal incl. btw"
						name="amountInclCents"
						description="Neem het totaal over van de factuur als het enkele centen afwijkt.">
						<CPriceInput
							v-model="state.amountInclCents"
							class="w-full" />
					</UFormField>
					<UFormField
						label="Factuurnummer"
						name="invoiceNumber">
						<UInput
							v-model="invoiceNumber"
							class="w-full" />
					</UFormField>
					<UFormField
						label="Factuurdatum"
						name="invoiceDate">
						<CDateInput v-model="state.invoiceDate" />
					</UFormField>
					<UFormField
						label="Vervaldatum"
						name="dueDate">
						<CDateInput v-model="state.dueDate" />
					</UFormField>
					<UFormField
						label="Betaald op"
						name="paidOn">
						<CDateInput v-model="state.paidOn" />
					</UFormField>
					<UFormField
						label="Betaalwijze"
						name="paymentMethod">
						<USelect
							v-model="state.paymentMethod"
							:items="paymentOptions"
							placeholder="—"
							class="w-full" />
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
			<template v-if="expense">
				<USeparator class="my-6" />
				<h3 class="text-highlighted mb-3 font-semibold">Factuur</h3>
				<CAttachments
					entityType="expense"
					:entityId="expense.id" />
			</template>
		</template>
	</UModal>
</template>

<script setup lang="ts">
	import type * as z from 'zod';

	import { expenseSchema } from '#shared/schemas/budget';

	const props = defineProps<{
		expense?: ExpenseView | null;
		quotes: QuoteView[];
	}>();

	const emit = defineEmits<{
		close: [saved: boolean];
	}>();

	useZodLocale();
	const { categoryOptions, contactOptions, roomOptions } = useLookups();

	const state = reactive<z.input<typeof expenseSchema>>({
		description: props.expense?.description ?? '',
		contactId: props.expense?.contactId ?? null,
		quoteId: props.expense?.quoteId ?? null,
		categoryId: props.expense?.categoryId ?? null,
		roomId: props.expense?.roomId ?? null,
		amountExclCents: props.expense?.amountExclCents ?? 0,
		vatRate: props.expense?.vatRate ?? DEFAULT_VAT_RATE,
		amountInclCents: props.expense?.amountInclCents ?? 0,
		invoiceNumber: props.expense?.invoiceNumber ?? null,
		invoiceDate: props.expense?.invoiceDate ?? todayIso(),
		dueDate: props.expense?.dueDate ?? null,
		paidOn: props.expense?.paidOn ?? null,
		paymentMethod: props.expense?.paymentMethod ?? null,
		notes: props.expense?.notes ?? null
	});
	const notes = useNullableText(state, 'notes');
	const invoiceNumber = useNullableText(state, 'invoiceNumber');

	function syncIncl() {
		state.amountInclCents = inclVatCents(state.amountExclCents ?? 0, state.vatRate ?? 0);
	}

	/** Picking a quote fills in who and what, so an invoice is two clicks. */
	function onQuoteChosen(quoteId: unknown) {
		const quote = props.quotes.find((candidate) => candidate.id === quoteId);
		if (!quote) return;
		state.contactId ??= quote.contactId;
		state.categoryId ??= quote.categoryId;
		state.vatRate = quote.vatRate;
	}

	const quoteOptions = computed(() =>
		props.quotes
			.filter((quote) => quote.status === 'approved' || quote.id === state.quoteId)
			.map((quote) => ({ label: `${quote.title} (${formatPrice(quote.amountInclCents)})`, value: quote.id }))
	);
	const vatOptions = VAT_RATES.map((rate) => ({ label: `${rate}%`, value: rate }));
	const paymentOptions = PAYMENT_METHODS.map((method) => ({ label: PAYMENT_METHOD_LABELS[method], value: method }));

	const { run: save, pending } = useAction(
		() =>
			props.expense
				? $fetch(`/api/expenses/${props.expense.id}`, { method: 'PATCH', body: state })
				: $fetch('/api/expenses', { method: 'POST', body: state }),
		{ success: 'Bewaard', onSuccess: () => emit('close', true) }
	);
</script>

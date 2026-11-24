<template>
	<CPage
		id="budget"
		title="Budget">
		<template #actions>
			<UDropdownMenu :items="addItems">
				<UButton
					icon="i-lucide-plus"
					label="Toevoegen"
					trailingIcon="i-lucide-chevron-down" />
			</UDropdownMenu>
		</template>

		<div
			v-if="budget"
			class="grid grid-cols-2 gap-3 lg:grid-cols-4">
			<CStatTile
				label="Budget"
				icon="i-lucide-piggy-bank"
				:value="formatPriceRounded(budget.totals.plannedCents)"
				:hint="`+ ${formatPriceRounded(budget.totals.contingencyCents)} onvoorzien (${budget.contingencyPercent}%)`" />
			<CStatTile
				label="Verwachte kost"
				icon="i-lucide-trending-up"
				:value="formatPriceRounded(budget.totals.forecastCents)"
				:hint="forecastHint" />
			<CStatTile
				label="Betaald"
				icon="i-lucide-check-check"
				:value="formatPriceRounded(budget.totals.paidCents)"
				:hint="`${formatPriceRounded(budget.totals.invoicedCents - budget.totals.paidCents)} nog te betalen`" />
			<CStatTile
				label="Premies"
				icon="i-lucide-hand-coins"
				:value="formatPriceRounded(budget.totals.subsidiesExpectedCents)"
				:hint="`${formatPriceRounded(budget.totals.subsidiesReceivedCents)} ontvangen`" />
		</div>

		<UTabs
			v-model="tab"
			:items="tabs"
			variant="link"
			:content="false"
			class="w-full" />

		<template v-if="budget">
			<UCard v-if="tab === 'overview'">
				<template #header>
					<CSectionHeading
						size="sm"
						title="Per werkpost"
						description="Verwachte eindkost tegenover het geplande budget (incl. btw)." />
				</template>
				<CCategoryBudgetBars :categories="budget.categories" />
				<template #footer>
					<p class="text-muted text-sm">
						Netto eindkost (verwacht + onvoorzien − premies):
						<span class="text-highlighted font-semibold">{{ formatPrice(budget.totals.netForecastCents) }}</span>
					</p>
				</template>
			</UCard>

			<UTable
				v-else-if="tab === 'lines'"
				:data="budget.lines"
				:columns="lineColumns"
				class="border-default rounded-lg border"
				:ui="{ tr: 'cursor-pointer' }"
				@select="(_event, row) => editLine(row.original)">
				<template #empty>
					<UEmpty
						icon="i-lucide-piggy-bank"
						title="Nog geen budgetposten"
						description="Begin met een ruwe schatting per werkpost; offertes en facturen vullen het later aan." />
				</template>
			</UTable>

			<UTable
				v-else-if="tab === 'quotes'"
				:data="budget.quotes"
				:columns="quoteColumns"
				class="border-default rounded-lg border"
				:ui="{ tr: 'cursor-pointer' }"
				@select="(_event, row) => editQuote(row.original)">
				<template #empty>
					<UEmpty
						icon="i-lucide-file-signature"
						title="Nog geen offertes" />
				</template>
			</UTable>

			<template v-else-if="tab === 'expenses'">
				<div class="flex justify-end">
					<UButton
						icon="i-lucide-download"
						label="Exporteer naar Excel"
						color="neutral"
						variant="outline"
						size="sm"
						@click="exportExpenses" />
				</div>
				<UTable
					:data="budget.expenses"
					:columns="expenseColumns"
					class="border-default rounded-lg border"
					:ui="{ tr: 'cursor-pointer' }"
					@select="(_event, row) => editExpense(row.original)">
					<template #empty>
						<UEmpty
							icon="i-lucide-receipt"
							title="Nog geen facturen" />
					</template>
				</UTable>
			</template>

			<UTable
				v-else-if="tab === 'subsidies'"
				:data="budget.subsidies"
				:columns="subsidyColumns"
				class="border-default rounded-lg border"
				:ui="{ tr: 'cursor-pointer' }"
				@select="(_event, row) => editSubsidy(row.original)">
				<template #empty>
					<UEmpty
						icon="i-lucide-hand-coins"
						title="Nog geen premies"
						description="Denk aan Mijn VerbouwPremie (dak, isolatie, ramen, elektriciteit, …)." />
				</template>
			</UTable>
		</template>
	</CPage>
</template>

<script setup lang="ts">
	import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';

	import { CBudgetLineModal, CExpenseModal, CQuoteModal, CSubsidyModal } from '#components';

	definePageMeta({ middleware: 'internal' });

	const UBadge = resolveComponent('UBadge');
	const UButton = resolveComponent('UButton');
	const CCategoryDot = resolveComponent('CCategoryDot');

	const { data: budget, refresh } = await useFetch<BudgetOverview>('/api/budget', { key: 'budget' });
	const { categories, contacts } = useLookups();
	const today = todayIso();

	const route = useRoute();
	const router = useRouter();
	const tab = computed({
		get: () => (typeof route.query.tab === 'string' ? route.query.tab : 'overview'),
		set: (value: string) => router.replace({ query: { ...route.query, tab: value } })
	});
	const tabs = computed(() => [
		{ label: 'Overzicht', value: 'overview', icon: 'i-lucide-chart-bar' },
		{ label: 'Budget', value: 'lines', icon: 'i-lucide-piggy-bank', badge: budget.value?.lines.length || undefined },
		{
			label: 'Offertes',
			value: 'quotes',
			icon: 'i-lucide-file-signature',
			badge: budget.value?.quotes.length || undefined
		},
		{
			label: 'Facturen',
			value: 'expenses',
			icon: 'i-lucide-receipt',
			badge: budget.value?.expenses.length || undefined
		},
		{ label: 'Premies', value: 'subsidies', icon: 'i-lucide-hand-coins' }
	]);

	const forecastHint = computed(() => {
		const totals = budget.value?.totals;
		if (!totals?.plannedCents) return undefined;
		const difference = totals.forecastCents - totals.plannedCents;

		if (Math.abs(difference) < 100) return 'binnen budget';

		return difference > 0
			? `${formatPriceRounded(difference)} boven budget`
			: `${formatPriceRounded(-difference)} onder budget`;
	});

	const overlay = useOverlay();
	const lineModal = overlay.create(CBudgetLineModal);
	const quoteModal = overlay.create(CQuoteModal);
	const expenseModal = overlay.create(CExpenseModal);
	const subsidyModal = overlay.create(CSubsidyModal);

	async function afterSave(result: Promise<unknown>) {
		if (await result) await refresh();
	}

	const editLine = (line: BudgetLineView | null = null) => afterSave(lineModal.open({ line }).result);
	const editQuote = (quote: QuoteView | null = null) => afterSave(quoteModal.open({ quote }).result);
	const editExpense = (expense: ExpenseView | null = null) =>
		afterSave(expenseModal.open({ expense, quotes: budget.value?.quotes ?? [] }).result);
	const editSubsidy = (subsidy: SubsidyView | null = null) => afterSave(subsidyModal.open({ subsidy }).result);

	const addItems: DropdownMenuItem[] = [
		{ label: 'Budgetpost', icon: 'i-lucide-piggy-bank', onSelect: () => editLine() },
		{ label: 'Offerte', icon: 'i-lucide-file-signature', onSelect: () => editQuote() },
		{ label: 'Factuur / uitgave', icon: 'i-lucide-receipt', onSelect: () => editExpense() },
		{ label: 'Premie', icon: 'i-lucide-hand-coins', onSelect: () => editSubsidy() }
	];

	const remove = useAction(
		async (path: string) => {
			await $fetch(path, { method: 'DELETE' });
			await refresh();
		},
		{ confirm: () => 'Definitief verwijderen?', success: 'Verwijderd' }
	).run;

	const categoryCell = (categoryId: string | null) => {
		const category = categoryId ? categories.value.get(categoryId) : undefined;

		return category
			? h('span', { class: 'flex items-center gap-2' }, [h(CCategoryDot, { color: category.color }), category.name])
			: '';
	};
	const contactName = (contactId: string | null) => (contactId ? (contacts.value.get(contactId)?.name ?? '') : '');
	const money = (cents: number) => h('span', { class: 'tabular-nums' }, formatPrice(cents));
	const deleteButton = (path: string) =>
		h(UButton, {
			icon: 'i-lucide-trash-2',
			color: 'neutral',
			variant: 'ghost',
			size: 'sm',
			'aria-label': 'Verwijder',
			onClick: (event: Event) => {
				event.stopPropagation();
				void remove(path);
			}
		});
	const rightAligned = { class: { th: 'text-right', td: 'text-right' } };

	const lineColumns: TableColumn<BudgetLineView>[] = [
		{ accessorKey: 'label', header: 'Omschrijving' },
		{ accessorKey: 'categoryId', header: 'Werkpost', cell: ({ row }) => categoryCell(row.original.categoryId) },
		{
			accessorKey: 'plannedCents',
			header: 'Gepland',
			cell: ({ row }) => money(row.original.plannedCents),
			meta: rightAligned
		},
		{ id: 'actions', cell: ({ row }) => deleteButton(`/api/budget-lines/${row.original.id}`), meta: rightAligned }
	];

	const quoteColumns: TableColumn<QuoteView>[] = [
		{ accessorKey: 'title', header: 'Offerte' },
		{ accessorKey: 'contactId', header: 'Van', cell: ({ row }) => contactName(row.original.contactId) },
		{ accessorKey: 'categoryId', header: 'Werkpost', cell: ({ row }) => categoryCell(row.original.categoryId) },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const meta = QUOTE_STATUS_META[row.original.status];
				return h(UBadge, { label: meta.label, color: meta.color, variant: 'subtle' });
			}
		},
		{
			accessorKey: 'amountInclCents',
			header: 'Incl. btw',
			cell: ({ row }) => money(row.original.amountInclCents),
			meta: rightAligned
		},
		{ id: 'actions', cell: ({ row }) => deleteButton(`/api/quotes/${row.original.id}`), meta: rightAligned }
	];

	const expenseColumns: TableColumn<ExpenseView>[] = [
		{
			accessorKey: 'invoiceDate',
			header: 'Datum',
			cell: ({ row }) => formatDate(row.original.invoiceDate)
		},
		{ accessorKey: 'description', header: 'Omschrijving' },
		{ accessorKey: 'contactId', header: 'Van', cell: ({ row }) => contactName(row.original.contactId) },
		{ accessorKey: 'categoryId', header: 'Werkpost', cell: ({ row }) => categoryCell(row.original.categoryId) },
		{
			id: 'paid',
			header: 'Betaald',
			cell: ({ row }) => {
				const { paidOn, dueDate } = row.original;
				if (paidOn) return h(UBadge, { label: formatDate(paidOn, 'dayMonth'), color: 'success', variant: 'subtle' });
				const late = dueDate && dueDate < today;
				return h(UBadge, {
					label: dueDate ? `vervalt ${formatDate(dueDate, 'dayMonth')}` : 'open',
					color: late ? 'error' : 'warning',
					variant: 'subtle'
				});
			}
		},
		{
			accessorKey: 'amountInclCents',
			header: 'Incl. btw',
			cell: ({ row }) => money(row.original.amountInclCents),
			meta: rightAligned
		},
		{ id: 'actions', cell: ({ row }) => deleteButton(`/api/expenses/${row.original.id}`), meta: rightAligned }
	];

	const subsidyColumns: TableColumn<SubsidyView>[] = [
		{ accessorKey: 'name', header: 'Premie' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const meta = SUBSIDY_STATUS_META[row.original.status];
				return h(UBadge, { label: meta.label, color: meta.color, variant: 'subtle' });
			}
		},
		{ accessorKey: 'deadline', header: 'Aanvragen vóór', cell: ({ row }) => formatDate(row.original.deadline) },
		{
			accessorKey: 'expectedCents',
			header: 'Verwacht',
			cell: ({ row }) => money(row.original.expectedCents),
			meta: rightAligned
		},
		{
			accessorKey: 'receivedCents',
			header: 'Ontvangen',
			cell: ({ row }) => money(row.original.receivedCents),
			meta: rightAligned
		},
		{ id: 'actions', cell: ({ row }) => deleteButton(`/api/subsidies/${row.original.id}`), meta: rightAligned }
	];

	async function exportExpenses() {
		const XLSX = await import('xlsx');
		const rows = (budget.value?.expenses ?? []).map((expense) => ({
			Factuurdatum: expense.invoiceDate ?? '',
			Omschrijving: expense.description,
			Factuurnummer: expense.invoiceNumber ?? '',
			Leverancier: contactName(expense.contactId),
			Werkpost: expense.categoryId ? (categories.value.get(expense.categoryId)?.name ?? '') : '',
			'Excl. btw': centsToEuro(expense.amountExclCents),
			'Btw %': expense.vatRate,
			'Incl. btw': centsToEuro(expense.amountInclCents),
			'Betaald op': expense.paidOn ?? ''
		}));
		const sheet = XLSX.utils.json_to_sheet(rows);
		const book = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(book, sheet, 'Facturen');
		XLSX.writeFile(book, `facturen-${today}.xlsx`);
	}
</script>

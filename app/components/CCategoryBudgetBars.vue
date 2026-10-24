<template>
	<div class="space-y-4">
		<p
			v-if="rows.length === 0"
			class="text-muted py-4 text-center text-sm">
			Nog geen budget ingevuld.
		</p>
		<div
			v-for="row in rows"
			:key="row.categoryId ?? 'none'"
			class="space-y-1.5">
			<div class="flex items-baseline justify-between gap-3 text-sm">
				<span class="text-highlighted flex min-w-0 items-center gap-2 font-medium">
					<CCategoryDot :color="row.color" />
					<span class="truncate">{{ row.name }}</span>
				</span>
				<span
					class="shrink-0 tabular-nums"
					:class="row.over ? 'text-error font-medium' : 'text-muted'">
					{{ formatPriceRounded(row.forecastCents) }}
					<span v-if="row.plannedCents"> / {{ formatPriceRounded(row.plannedCents) }}</span>
				</span>
			</div>
			<!-- Paid is solid, committed-but-unpaid lighter, the rest of the plan is the track. -->
			<UTooltip :text="row.tooltip">
				<div
					class="bg-elevated relative h-2.5 w-full overflow-hidden rounded-full"
					role="img"
					:aria-label="row.tooltip">
					<div
						class="bg-primary/35 absolute inset-y-0 left-0"
						:style="{ width: `${row.knownPercent}%` }" />
					<div
						class="bg-primary absolute inset-y-0 left-0"
						:style="{ width: `${row.paidPercent}%` }" />
					<div
						v-if="row.over"
						class="bg-error absolute inset-y-0 right-0 w-1" />
				</div>
			</UTooltip>
		</div>
		<div
			v-if="rows.length"
			class="text-muted flex flex-wrap gap-4 text-xs">
			<span class="flex items-center gap-1.5"><span class="bg-primary size-2.5 rounded-full" /> Betaald</span>
			<span class="flex items-center gap-1.5"
				><span class="bg-primary/35 size-2.5 rounded-full" /> Gefactureerd, goedgekeurd of te kopen</span
			>
			<span class="flex items-center gap-1.5"
				><span class="bg-elevated size-2.5 rounded-full" /> Rest van het budget</span
			>
		</div>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps<{
		categories: CategoryBudget[];
	}>();

	const { categories: categoryById } = useLookups();

	const rows = computed(() =>
		props.categories
			.filter((entry) => entry.forecastCents > 0 || entry.plannedCents > 0)
			.map((entry) => {
				const category = entry.categoryId ? categoryById.value.get(entry.categoryId) : undefined;
				const scale = Math.max(entry.plannedCents, entry.forecastCents, 1);
				const known = Math.max(entry.invoicedCents, entry.committedCents) + entry.purchasesCents;
				const over = entry.plannedCents > 0 && entry.forecastCents > entry.plannedCents;

				return {
					...entry,
					name: category?.name ?? 'Zonder werkpost',
					color: category?.color,
					sortOrder: category?.sortOrder ?? Number.MAX_SAFE_INTEGER,
					over,
					paidPercent: (entry.paidCents / scale) * 100,
					knownPercent: (known / scale) * 100,
					tooltip: [
						`Gepland ${formatPrice(entry.plannedCents)}`,
						`goedgekeurd ${formatPrice(entry.committedCents)}`,
						`gefactureerd ${formatPrice(entry.invoicedCents)}`,
						`betaald ${formatPrice(entry.paidCents)}`,
						entry.purchasesCents ? `nog te kopen ${formatPrice(entry.purchasesCents)}` : ''
					]
						.filter(Boolean)
						.join(' · ')
				};
			})
			.sort((a, b) => a.sortOrder - b.sortOrder)
	);
</script>

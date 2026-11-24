<template>
	<UInputNumber
		v-model="euros"
		:min="0"
		:step="0.01"
		:formatOptions="{ style: 'currency', currency: 'EUR' }"
		locale="nl-BE"
		:placeholder="placeholder"
		:increment="false"
		:decrement="false" />
</template>

<script setup lang="ts">
	/** Edits a price in euros while the model stays in integer cents, like the API. */
	const cents = defineModel<number | null | undefined>();

	defineProps<{
		placeholder?: string;
	}>();

	const euros = computed<number | null>({
		get: () => (cents.value === null || cents.value === undefined ? null : centsToEuro(cents.value)),
		set: (value) => {
			cents.value = value === null || value === undefined || Number.isNaN(value) ? null : euroToCents(value);
		}
	});
</script>

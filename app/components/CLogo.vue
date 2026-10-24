<template>
	<NuxtLink
		to="/"
		class="text-highlighted flex items-center gap-2 font-bold"
		aria-label="Leopoldlaan – overzicht">
		<span class="bg-primary text-inverted flex size-7 shrink-0 items-center justify-center rounded-md">
			<UIcon
				name="i-lucide-house-plus"
				class="size-4" />
		</span>
		<span
			v-if="!iconOnly"
			class="truncate">
			{{ name }}
		</span>
	</NuxtLink>
</template>

<script setup lang="ts">
	withDefaults(
		defineProps<{
			iconOnly?: boolean;
			name?: string;
		}>(),
		{ name: 'Leopoldlaan' }
	);
</script>

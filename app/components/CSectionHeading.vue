<template>
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0">
			<h2
				class="text-highlighted"
				:class="size === 'lg' ? 'text-lg font-bold' : 'font-semibold'">
				{{ title }}
			</h2>
			<p
				v-if="description"
				class="text-muted text-sm">
				{{ description }}
			</p>
		</div>
		<slot name="actions" />
	</div>
</template>

<script setup lang="ts">
	/** Section (lg) or card-header (sm) title, with an optional description and actions on the right. */
	withDefaults(
		defineProps<{
			title: string;
			description?: string;
			size?: 'sm' | 'lg';
		}>(),
		{ size: 'lg' }
	);
</script>

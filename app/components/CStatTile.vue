<template>
	<div class="border-default bg-default rounded-lg border p-3 sm:p-4">
		<p class="text-muted flex items-center gap-1.5 text-sm">
			<UIcon
				:name="icon"
				class="size-4 shrink-0" />
			{{ label }}
		</p>
		<p class="text-highlighted mt-1 text-2xl font-semibold tabular-nums">{{ value }}</p>
		<p
			v-if="hint"
			class="text-dimmed mt-0.5 text-xs">
			{{ hint }}
		</p>
	</div>
</template>

<script setup lang="ts">
	defineProps<{
		label: string;
		value: string | number;
		icon: string;
		hint?: string;
	}>();
</script>

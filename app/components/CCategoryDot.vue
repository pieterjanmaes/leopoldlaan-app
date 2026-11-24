<template>
	<span
		class="inline-block size-2.5 shrink-0 rounded-full"
		:class="color ? `bg-${color}-500` : 'bg-(--ui-border-accented)'"
		aria-hidden="true" />
</template>

<script setup lang="ts">
	defineProps<{
		color?: CategoryColor | null;
	}>();
</script>

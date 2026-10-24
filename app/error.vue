<template>
	<UApp :locale="nl">
		<UError
			:error="error"
			redirect="/"
			:clear="{ label: 'Terug naar overzicht' }" />
	</UApp>
</template>

<script setup lang="ts">
	import { nl } from '@nuxt/ui/locale';

	import type { NuxtError } from '#app';

	defineProps<{
		error: NuxtError;
	}>();

	useHead({
		htmlAttrs: { lang: 'nl-BE' },
		bodyAttrs: {
			class: 'min-h-full h-[1px]'
		}
	});
</script>

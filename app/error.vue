<template>
	<UApp :locale="locales[locale as keyof typeof locales]">
		<CHeader />

		<UError
			:error="error"
			:redirect="localePath('/')" />
	</UApp>
</template>

<script setup lang="ts">
	import * as locales from '@nuxt/ui/locale';

	import type { NuxtError } from '#app';

	const { locale } = useI18n();
	const localePath = useLocalePath();

	defineProps<{
		error: NuxtError;
	}>();

	useHead({
		bodyAttrs: {
			class: 'min-h-full h-[1px]'
		}
	});
</script>

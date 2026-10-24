<template>
	<UApp :locale="uiLocale">
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>

<script setup lang="ts">
	import { fr, nl } from '@nuxt/ui/locale';

	const { locale } = useI18n();
	const uiLocale = computed(() => (locale.value === 'fr' ? fr : nl));

	useHead({
		bodyAttrs: {
			class: 'min-h-full h-[1px]'
		}
	});
</script>

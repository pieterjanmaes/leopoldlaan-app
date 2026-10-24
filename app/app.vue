<template>
	<UApp :locale="nl">
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>

<script setup lang="ts">
	import { nl } from '@nuxt/ui/locale';

	useHead({
		htmlAttrs: { lang: 'nl-BE' },
		titleTemplate: (title) => (title ? `${title} · Leopoldlaan` : 'Leopoldlaan'),
		bodyAttrs: {
			class: 'min-h-full h-[1px]'
		}
	});
</script>

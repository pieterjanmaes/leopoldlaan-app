<template>
	<USelectMenu
		:modelValue="locale"
		:items="Object.values(locales)"
		valueKey="code"
		labelKey="name"
		color="neutral"
		variant="ghost"
		icon="heroicons:globe-alt"
		arrow
		:searchInput="false"
		class="w-38"
		@update:model-value="switchLocale($event)" />
</template>

<script setup lang="ts">
	const { locale, locales } = useI18n();
	const router = useRouter();

	const translatedPaths = useState<Record<string, string>>('translatedPaths', () => ({}));

	function switchLocale(targetLocale: string) {
		const translatedPath = translatedPaths.value[targetLocale];
		if (translatedPath) {
			router.push(translatedPath);
		} else {
			const currentPath = router.currentRoute.value.path;
			const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(\/|$)/, '/');
			const newPath = `/${targetLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
			router.push(newPath);
		}
	}
</script>

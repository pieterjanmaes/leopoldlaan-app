<template>
	<ContentRenderer
		v-if="page"
		:value="page"
		:data="page" />
</template>

<script setup lang="ts">
	import type { Collections } from '@nuxt/content';
	import { withLeadingSlash } from 'ufo';

	const route = useRoute();
	const { locale, locales, t } = useI18n();
	const { getAllTranslatedPaths } = useTranslatedPath();

	const slug = computed(() => {
		const slugParam = route.params.slug;
		const slugPath = Array.isArray(slugParam) ? slugParam.join('/') : slugParam;
		return withLeadingSlash(slugPath || '');
	});

	const { data: page } = await useAsyncData(
		`page-${locale.value}-${slug.value}`,
		async () => {
			const collection = ('content_' + locale.value) as keyof Collections;
			const content = await queryCollection(collection).path(slug.value).first();

			if (!content && locale.value !== 'nl') {
				return await queryCollection('content_nl').path(slug.value).first();
			}

			return content;
		},
		{
			watch: [locale, slug]
		}
	);

	if (!page.value) {
		throw createError({
			statusCode: 404,
			statusMessage: t('error.pageNotFound')
		});
	}

	const { data: translatedPaths } = await useAsyncData(
		`i18n-paths-${locale.value}-${slug.value}`,
		async () => {
			const canonicalId = (page.value as { canonicalId?: string })?.canonicalId;
			return await getAllTranslatedPaths(canonicalId);
		},
		{
			watch: [page]
		}
	);

	function buildI18nParams(paths: Record<string, string> | null | undefined) {
		const params: Record<string, { slug: string[] }> = {};
		if (!paths) return params;

		for (const loc of locales.value as Array<{ code: string }>) {
			const path = paths[loc.code];
			if (path) {
				const slugPath = path.replace(new RegExp(`^/${loc.code}/?`), '');
				params[loc.code] = { slug: slugPath ? slugPath.split('/') : [] };
			}
		}
		return params;
	}

	useSetI18nParams(buildI18nParams(translatedPaths.value));

	const sharedTranslatedPaths = useState<Record<string, string>>('translatedPaths', () => ({}));
	if (translatedPaths.value) {
		sharedTranslatedPaths.value = translatedPaths.value;
	}

	watch(translatedPaths, (paths) => {
		useSetI18nParams(buildI18nParams(paths));
		if (paths) {
			sharedTranslatedPaths.value = paths;
		}
	});

	const baseUrl = useRuntimeConfig().public.i18n?.baseUrl || '';
	const hreflangLinks = computed(() => {
		const links: Array<{ rel: string; hreflang: string; href: string }> = [];
		if (!translatedPaths.value) return links;

		for (const loc of locales.value as Array<{ code: string; language: string }>) {
			const path = translatedPaths.value[loc.code];
			if (path) {
				links.push({
					rel: 'alternate',
					hreflang: loc.language || loc.code,
					href: `${baseUrl}${path}`
				});
			}
		}

		const defaultPath = translatedPaths.value['nl'];
		if (defaultPath) {
			links.push({
				rel: 'alternate',
				hreflang: 'x-default',
				href: `${baseUrl}${defaultPath}`
			});
		}

		return links;
	});

	useHead({
		titleTemplate: '%siteName',
		link: hreflangLinks
	});
</script>

<template>
	<ClientOnly>
		<div
			id="cookiefirst-policy-page"
			class="prose py-8" />
	</ClientOnly>

	<div class="prose">
		<p>
			{{ t('cookiePolicy.createdBy') }}
			<br />
			<a
				:href="`https://cookiefirst.com/${locale}/consent-management-platform/`"
				target="_blank"
				rel="noopener">
				Consent Management Platform - CookieFirst
			</a>
		</p>
	</div>
</template>

<script setup lang="ts">
	const { t, locale } = useI18n();

	const cookieFirst = useState('cookieFirst');

	onMounted(() => {
		// @ts-expect-error CookieFirst global injected by client plugin
		cookieFirst.value?.renderEmbeds();
	});

	watch(locale, () => {
		// @ts-expect-error CookieFirst global injected by client plugin
		cookieFirst.value?.renderEmbeds();
	});
</script>

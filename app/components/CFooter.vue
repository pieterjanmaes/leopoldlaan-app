<template>
	<UFooter id="footer">
		<template #left>
			<p class="text-sm">© {{ new Date().getFullYear() }}. {{ t('footer.allRightsReserved') }}</p>
		</template>

		<UButton
			color="inverted"
			variant="link"
			:to="localePath('/privacy-policy')">
			{{ t('footer.navigation.privacyPolicy') }}
		</UButton>

		<UButton
			color="inverted"
			variant="link"
			:to="localePath('/cookie-policy')">
			{{ t('footer.navigation.cookiePolicy') }}
		</UButton>

		<template #right>
			<UButton
				color="inverted"
				variant="link"
				class="cursor-pointer"
				@click="openCookiePanel()">
				{{ t('footer.navigation.cookieChangeSettings') }}
			</UButton>
		</template>
	</UFooter>
</template>

<script setup lang="ts">
	const { t } = useI18n();
	const localePath = useLocalePath();

	const cookieFirst = useState('cookieFirst');

	const openCookiePanel = () => {
		// @ts-expect-error CookieFirst global injected by client plugin
		cookieFirst.value?.openPanel();
	};
</script>

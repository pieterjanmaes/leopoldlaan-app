<template>
	<UIcon
		v-if="country.flag"
		:name="country.flag"
		class="size-5 shrink-0 rounded-xs"
		role="img"
		:aria-label="country.label"
		:aria-hidden="false" />
	<!-- flagpack has no icon for a handful of ISO codes (AC, BQ, TA, XK) -->
	<abbr
		v-else
		class="text-muted text-xs no-underline"
		:title="country.label">
		{{ country.id }}
	</abbr>
</template>

<script setup lang="ts">
	import type { CountryOption } from '~/composables/useCountryOptions';

	// The phone field's collapsed trigger shows a flag with no name next to it
	// (just the dial code), so the icon carries the localized country name as its
	// accessible label.
	defineProps<{ country: CountryOption }>();
</script>

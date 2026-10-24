<template>
	<UFieldGroup class="w-full">
		<!-- The popup is wider than its trigger (the trigger only holds a flag and a
		     dial code), and Reka centres content on the anchor by default — hence
		     `align: 'start'` to pin it to the trigger's left edge. -->
		<USelectMenu
			v-model="selectedCountry"
			class="w-28"
			:items="countries"
			valueKey="id"
			:aria-label="t('form.phoneCountry')"
			:searchInput="{
				placeholder: t('form.phoneCountrySearch'),
				icon: 'i-lucide-search'
			}"
			:ui="{ content: 'w-80' }"
			:content="{ align: 'start' }">
			<!-- The trigger is too narrow for a name, so it shows flag + dial code
			     only; the open list adds the country name. -->
			<template #leading>
				<CCountryFlag
					v-if="selectedCountryOption"
					:country="selectedCountryOption" />
			</template>
			<template #default>
				<span class="text-muted text-xs">+{{ selectedCountryDialcode }}</span>
			</template>
			<!-- itemLabel is a block with `truncate`, so the flag and dial code need
			     their own flex row or they stack on top of each other. -->
			<template #item-label="{ item: country }">
				<span class="flex items-center gap-2">
					<CCountryFlag :country />
					<span class="text-muted text-xs">+{{ country.dialCode }}</span>
					<span class="truncate">{{ country.label }}</span>
				</span>
			</template>
		</USelectMenu>

		<UInput
			type="tel"
			class="w-full"
			:modelValue="phoneNumber"
			:placeholder="inputLabel"
			@update:model-value="
				onPhoneNumberChanged({
					newPhoneNumber: String($event),
					autoFormat,
					noFormattingAsYouType: false
				})
			" />
	</UFieldGroup>
</template>

<script lang="ts" setup>
	import type { CountryCode, Examples } from 'libphonenumber-js';

	// Used when the locale's language tag carries no country.
	const FALLBACK_COUNTRY: CountryCode = 'BE';

	const props = defineProps<{
		modelValue?: string | null;
	}>();

	const emit = defineEmits<{
		'update:modelValue': [value: string | null];
	}>();

	const { t, locale, localeProperties } = useI18n();
	const { getPhoneNumberExamplesFile, getPhoneNumberExample, getPhoneNumberResults, sanitizePhoneNumber } =
		usePhoneNumber();
	const { countries } = useCountryOptions();

	const localeCountry = () => localeToCountryCode(localeProperties.value.language ?? '') ?? FALLBACK_COUNTRY;

	const phoneNumber = ref<string>('');
	const autoFormat = ref<boolean>(true);
	// The locale's country (`nl-BE` → BE) is the best guess for the visitor's dial code — and it
	// also drives the national example number used as the input's placeholder.
	const selectedCountry = ref<CountryCode>(localeCountry());
	const results = ref<{
		isValid: boolean;
		countryCode?: CountryCode;
		e164?: string;
		formatNational?: string;
	}>({
		isValid: false,
		countryCode: undefined
	});

	const selectedCountryOption = computed(() => countries.value.find((country) => country.id === selectedCountry.value));

	const selectedCountryDialcode = computed(() => selectedCountryOption.value?.dialCode);

	const inputLabel = computed(() => {
		const defaultPlaceholder = t('form.phone');
		const example = getPhoneNumberExample(examples.value as Examples, selectedCountry.value);
		return example || defaultPlaceholder;
	});

	watch(
		() => selectedCountry.value,
		(value, oldValue) => {
			if (value && value !== oldValue) {
				onCountryChanged({
					countryCode: value,
					autoFormat: autoFormat.value,
					noFormattingAsYouType: false
				});
			}
		}
	);

	// Switching locale normally navigates and remounts the form, but re-seed anyway for the
	// cases where it does not. Only while the field is empty, so a number the visitor already
	// typed (and the country parsed from it) is never overwritten.
	watch(locale, () => {
		if (phoneNumber.value) return;
		selectedCountry.value = localeCountry();
	});

	// Initialize with modelValue if provided
	watch(
		() => props.modelValue,
		(value) => {
			if (value && value !== results.value.e164) {
				onPhoneNumberChanged({
					newPhoneNumber: value,
					autoFormat: true,
					noFormattingAsYouType: false
				});
			}
		},
		{ immediate: true }
	);

	// Registered last: everything after an `await` in <script setup> runs outside
	// Vue's effect scope, so the watchers above must come first or they leak.
	const { data: examples } = await useAsyncData('phone-examples', async () => await getPhoneNumberExamplesFile());

	function onPhoneNumberChanged({
		newPhoneNumber,
		autoFormat: doAutoFormat,
		noFormattingAsYouType: _noFormattingAsYouType,
		updateResults = true
	}: {
		newPhoneNumber: string;
		autoFormat: boolean;
		noFormattingAsYouType: boolean;
		updateResults?: boolean;
	}) {
		const containsOnlyNumbers = /^[\d\s()+-]*$/.test(newPhoneNumber);

		if (!containsOnlyNumbers) {
			results.value = { isValid: false, countryCode: undefined };
			emit('update:modelValue', null);
			return;
		}

		const sanitizedPhoneNumber = sanitizePhoneNumber(newPhoneNumber);

		if (sanitizedPhoneNumber === '') {
			results.value = { isValid: false, countryCode: undefined };
			emit('update:modelValue', null);
		} else if (updateResults) {
			results.value = getPhoneNumberResults({
				phoneNumber: sanitizedPhoneNumber,
				countryCode: selectedCountry.value
			});
			emit('update:modelValue', results.value.e164 || sanitizedPhoneNumber);
		}

		if (results.value.isValid && results.value.formatNational && doAutoFormat) {
			phoneNumber.value = results.value.formatNational;
		} else {
			phoneNumber.value = sanitizedPhoneNumber;
		}

		if (results.value.countryCode && results.value.countryCode !== selectedCountry.value) {
			selectedCountry.value = results.value.countryCode;
		}
	}

	function onCountryChanged({
		countryCode,
		autoFormat: doAutoFormat,
		noFormattingAsYouType,
		updateResults = true
	}: {
		countryCode?: CountryCode;
		autoFormat: boolean;
		noFormattingAsYouType: boolean;
		updateResults?: boolean;
	}) {
		if (updateResults && phoneNumber.value) {
			results.value = getPhoneNumberResults({
				phoneNumber: phoneNumber.value,
				countryCode
			});
		}

		if (phoneNumber.value) {
			onPhoneNumberChanged({
				newPhoneNumber: phoneNumber.value,
				autoFormat: doAutoFormat,
				noFormattingAsYouType,
				updateResults
			});
		}
	}
</script>

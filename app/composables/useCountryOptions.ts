import { type CountryCode, getCountries, getCountryCallingCode, isSupportedCountry } from 'libphonenumber-js';
import type { ComputedRef } from 'vue';

export interface CountryOption {
	id: CountryCode;
	/** Localized country name. Shown in every list, and what the search box filters on. */
	label: string;
	dialCode: string;
	/** Iconify name, or `undefined` for the handful of codes flagpack has no flag for. */
	flag: string | undefined;
}

// `flagpack:gb` is the England (St George) flag — the UK Union Jack is `gb-ukm`.
const FLAG_ICON_OVERRIDES: Record<string, string> = { gb: 'gb-ukm' };

// Codes `libphonenumber-js` knows but flagpack has no icon for. Listing them
// keeps the template from rendering a broken/blank icon: those entries fall
// back to the bare ISO code instead.
const FLAGLESS_COUNTRIES = new Set(['AC', 'BQ', 'TA', 'XK']);

export function countryFlagIcon(iso2: string): string | undefined {
	if (FLAGLESS_COUNTRIES.has(iso2)) return undefined;
	const slug = iso2.toLowerCase();
	return `flagpack:${FLAG_ICON_OVERRIDES[slug] ?? slug}`;
}

/**
 * The ISO country of a BCP-47 language tag (`nl-BE` → `BE`), or `undefined` when it has
 * none, so the caller picks a fallback.
 *
 * Uses `isSupportedCountry` straight from `libphonenumber-js` rather than `usePhoneNumber()`'s
 * `isCountryAvailable` wrapper, which logs an error for unsupported codes.
 */
export function localeToCountryCode(language: string): CountryCode | undefined {
	const suffix = language.split('-')[1]?.toUpperCase();
	if (!suffix || !isSupportedCountry(suffix)) return undefined;
	return suffix as CountryCode;
}

// `Intl.DisplayNames` construction is not free and the list is rebuilt whenever
// the locale changes, so keep one instance per locale for the app's lifetime.
const displayNamesCache = new Map<string, Intl.DisplayNames>();

function getDisplayNames(language: string): Intl.DisplayNames {
	let instance = displayNamesCache.get(language);
	if (!instance) {
		instance = new Intl.DisplayNames([language], { type: 'region' });
		displayNamesCache.set(language, instance);
	}
	return instance;
}

/**
 * The full ISO country list (from `libphonenumber-js`), with names translated into the
 * active locale via `Intl.DisplayNames` and sorted alphabetically for that locale. Used by
 * `CPhoneNumberInput`'s dial-code picker.
 *
 * Everything here is synchronous, so the list is a plain computed — it needs no
 * `useAsyncData` and produces identical output on server and client.
 */
export function useCountryOptions(): { countries: ComputedRef<CountryOption[]> } {
	const { localeProperties } = useI18n();

	const countries = computed<CountryOption[]>(() => {
		const language = localeProperties.value.language ?? 'nl-BE';
		const displayNames = getDisplayNames(language);

		return getCountries()
			.map((iso2) => ({
				id: iso2,
				label: displayNames.of(iso2) ?? iso2,
				dialCode: String(getCountryCallingCode(iso2)),
				flag: countryFlagIcon(iso2)
			}))
			.sort((a, b) => a.label.localeCompare(b.label, language));
	});

	return { countries };
}

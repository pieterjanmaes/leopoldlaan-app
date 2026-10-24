import { describe, expect, it } from 'vitest';

import { countryFlagIcon, localeToCountryCode } from '@/composables/useCountryOptions';

describe('localeToCountryCode', () => {
	it('takes the country from a language tag', () => {
		expect(localeToCountryCode('nl-BE')).toBe('BE');
		expect(localeToCountryCode('fr-be')).toBe('BE');
	});

	it('is undefined without a (supported) country', () => {
		expect(localeToCountryCode('nl')).toBeUndefined();
		expect(localeToCountryCode('en-COM')).toBeUndefined();
		expect(localeToCountryCode('')).toBeUndefined();
	});
});

describe('countryFlagIcon', () => {
	it('maps an ISO code to its flagpack icon', () => {
		expect(countryFlagIcon('BE')).toBe('flagpack:be');
	});

	it('uses the Union Jack for GB, not the England flag', () => {
		expect(countryFlagIcon('GB')).toBe('flagpack:gb-ukm');
	});

	it('has no icon for codes flagpack lacks', () => {
		expect(countryFlagIcon('XK')).toBeUndefined();
	});
});

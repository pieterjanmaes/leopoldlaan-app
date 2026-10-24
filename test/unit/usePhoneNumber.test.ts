import { describe, expect, it } from 'vitest';

import { usePhoneNumber } from '@/composables/usePhoneNumber';

const { sanitizePhoneNumber, getPhoneNumberResults, getAsYouTypeFormat, isSameCountryCallingCode } = usePhoneNumber();

describe('sanitizePhoneNumber', () => {
	it('keeps digits, spaces, brackets, plus and dashes', () => {
		expect(sanitizePhoneNumber('+32 (0)470-12 34 56')).toBe('+32 (0)470-12 34 56');
	});

	it('strips letters and other characters, then trims', () => {
		expect(sanitizePhoneNumber('  tel: 0470.12.34.56 ')).toBe('0470123456');
	});

	it('returns an empty string without input', () => {
		expect(sanitizePhoneNumber()).toBe('');
		expect(sanitizePhoneNumber('')).toBe('');
	});
});

describe('getPhoneNumberResults', () => {
	it('parses a valid Belgian mobile number', () => {
		const result = getPhoneNumberResults({ phoneNumber: '0470 12 34 56', countryCode: 'BE' });

		expect(result.isValid).toBe(true);
		expect(result.countryCode).toBe('BE');
		expect(result.e164).toBe('+32470123456');
	});

	it('takes the country from an international number', () => {
		const result = getPhoneNumberResults({ phoneNumber: '+33 6 12 34 56 78', countryCode: 'BE' });

		expect(result.isValid).toBe(true);
		expect(result.countryCode).toBe('FR');
	});

	it('is not valid for a number that is too short', () => {
		expect(getPhoneNumberResults({ phoneNumber: '0470', countryCode: 'BE' }).isValid).toBe(false);
	});

	it('is not valid without a number, and keeps the country', () => {
		expect(getPhoneNumberResults({ countryCode: 'BE' })).toEqual({ isValid: false, countryCode: 'BE' });
	});
});

describe('getAsYouTypeFormat', () => {
	it('formats a partial Belgian number as it is typed', () => {
		expect(getAsYouTypeFormat('BE', '0470123456')).toBe('0470 12 34 56');
	});

	it('returns an empty string without a number', () => {
		expect(getAsYouTypeFormat('BE')).toBe('');
	});
});

describe('isSameCountryCallingCode', () => {
	it('is true for countries sharing a calling code', () => {
		expect(isSameCountryCallingCode('US', 'CA')).toBe(true);
	});

	it('is false for countries with different calling codes', () => {
		expect(isSameCountryCallingCode('BE', 'NL')).toBe(false);
	});
});

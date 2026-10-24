import { addDays, daysBetween, isIsoDate, startOfWeek } from '@@/shared/utils/dates';
import { describe, expect, it } from 'vitest';

describe('calendar dates', () => {
	it('adds days across month, year and DST boundaries', () => {
		expect(addDays('2026-10-24', 8)).toBe('2026-11-01');
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
		// Belgium leaves summer time on 25 October 2026; a calendar day is still a day.
		expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
	});

	it('finds the Monday of a week', () => {
		expect(startOfWeek('2026-10-24')).toBe('2026-10-19'); // Saturday
		expect(startOfWeek('2026-10-19')).toBe('2026-10-19'); // Monday itself
		expect(startOfWeek('2026-10-25')).toBe('2026-10-19'); // Sunday belongs to the week before
	});

	it('recognises ISO dates only', () => {
		expect(isIsoDate('2026-10-24')).toBe(true);
		expect(isIsoDate('24/10/2026')).toBe(false);
	});
});

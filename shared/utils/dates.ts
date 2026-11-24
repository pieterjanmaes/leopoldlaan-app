/** Calendar dates are 'YYYY-MM-DD' strings throughout the app; these helpers never touch timezones. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
	return typeof value === 'string' && ISO_DATE.test(value);
}

/** Days since the epoch for a calendar date, computed in UTC so DST never adds or drops a day. */
export function dayNumber(isoDate: string): number {
	const [year, month, day] = isoDate.split('-').map(Number);

	return Math.floor(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) / 86_400_000);
}

export function fromDayNumber(days: number): string {
	return new Date(days * 86_400_000).toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
	return fromDayNumber(dayNumber(isoDate) + days);
}

export function daysBetween(fromIso: string, toIso: string): number {
	return dayNumber(toIso) - dayNumber(fromIso);
}

/** Monday of the week the date falls in. */
export function startOfWeek(isoDate: string): string {
	// Day 0 (1970-01-01) was a Thursday, so shift by 3 to make Monday index 0.
	const days = dayNumber(isoDate);
	const weekday = (((days + 3) % 7) + 7) % 7;

	return fromDayNumber(days - weekday);
}

/** Today as a calendar date in the given (or local) timezone, not in UTC. */
export function todayIso(timeZone?: string): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

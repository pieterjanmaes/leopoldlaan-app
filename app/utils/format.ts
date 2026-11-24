const LOCALE = 'nl-BE';

/** The app's date formatters, so every screen shows dates the same way. */
export const formatters = {
	/** "za 18 okt" */
	dayShort: new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' }),
	/** "18 okt" */
	dayMonth: new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' }),
	/** "18 okt 2026" */
	date: new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }),
	/** "oktober 2026" */
	monthYear: new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' }),
	/** "okt" */
	monthShort: new Intl.DateTimeFormat(LOCALE, { month: 'short' }),
	/** "18 okt 2026 14:05" */
	dateTime: new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' })
};

/** Parses a calendar date ("YYYY-MM-DD") at local noon, so the day never shifts with the timezone. */
export function toDate(calendarDate: string): Date {
	return new Date(`${calendarDate}T12:00:00`);
}

export function formatDate(calendarDate: string | null | undefined, style: keyof typeof formatters = 'date'): string {
	return calendarDate ? formatters[style].format(toDate(calendarDate)) : '';
}

export function formatDateTime(iso: string): string {
	return formatters.dateTime.format(new Date(iso));
}

/** "12,3 MB" */
export function formatBytes(bytes: number | null | undefined): string {
	if (!bytes) {
		return '';
	}
	const units = ['B', 'KB', 'MB', 'GB'];
	const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);

	return `${(bytes / 1024 ** exponent).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} ${units[exponent]}`;
}

/** Relative day label for due dates: "vandaag", "morgen", "3 dagen te laat", … */
export function dueLabel(dueDate: string, today: string): string {
	const days = daysBetween(today, dueDate);
	if (days === 0) {
		return 'vandaag';
	}
	if (days === 1) {
		return 'morgen';
	}
	if (days === -1) {
		return 'gisteren';
	}

	return days < 0 ? `${-days} dagen te laat` : formatDate(dueDate, 'dayMonth');
}

export function fileIcon(mimeType: string): string {
	if (mimeType === 'application/vnd.google-apps.folder') return 'i-lucide-folder';
	if (mimeType.startsWith('image/')) return 'i-lucide-image';
	if (mimeType === 'application/pdf') return 'i-lucide-file-text';
	if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'i-lucide-file-spreadsheet';
	if (mimeType.startsWith('video/')) return 'i-lucide-file-video';

	return 'i-lucide-file';
}

export function driveContentUrl(fileId: string, download = false): string {
	return `/api/drive/files/${encodeURIComponent(fileId)}/content${download ? '?download' : ''}`;
}

export function driveThumbnailUrl(fileId: string): string {
	return `/api/drive/files/${encodeURIComponent(fileId)}/thumbnail`;
}

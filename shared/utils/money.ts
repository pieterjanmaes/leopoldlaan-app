const priceFormatter = new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' });
const compactFormatter = new Intl.NumberFormat('nl-BE', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0
});

export function centsToEuro(cents: number): number {
	return cents / 100;
}

export function euroToCents(euro: number): number {
	return Math.round(euro * 100);
}

export function formatPrice(cents: number | null | undefined): string {
	if (cents === null || cents === undefined) {
		return '';
	}

	return priceFormatter.format(centsToEuro(cents));
}

/** Whole euros, for tiles and charts where cents are noise. */
export function formatPriceRounded(cents: number | null | undefined): string {
	if (cents === null || cents === undefined) {
		return '';
	}

	return compactFormatter.format(Math.round(centsToEuro(cents)));
}

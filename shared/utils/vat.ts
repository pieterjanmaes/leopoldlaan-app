export function vatAmountCents(amountExclCents: number, vatRate: number): number {
	return Math.round((amountExclCents * vatRate) / 100);
}

export function inclVatCents(amountExclCents: number, vatRate: number): number {
	return amountExclCents + vatAmountCents(amountExclCents, vatRate);
}

/** Inverse of inclVatCents, for invoices where only the total is known. */
export function exclVatCents(amountInclCents: number, vatRate: number): number {
	return Math.round((amountInclCents * 100) / (100 + vatRate));
}

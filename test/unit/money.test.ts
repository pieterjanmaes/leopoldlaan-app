import { euroToCents, formatPrice, formatPriceRounded } from '@@/shared/utils/money';
import { exclVatCents, inclVatCents, vatAmountCents } from '@@/shared/utils/vat';
import { describe, expect, it } from 'vitest';

// Intl uses a narrow no-break space between amount and symbol; normalise it for readable assertions.
const plain = (text: string) => text.replace(/\s/g, ' ');

describe('money', () => {
	it('rounds euros to whole cents', () => {
		expect(euroToCents(19.999)).toBe(2000);
		expect(euroToCents(0.1 + 0.2)).toBe(30);
	});

	it('formats in Belgian notation', () => {
		expect(plain(formatPrice(1_017_600))).toBe('€ 10.176,00');
		expect(plain(formatPriceRounded(840_049))).toBe('€ 8.400');
		expect(formatPrice(null)).toBe('');
	});
});

describe('vat', () => {
	it('adds 6% renovation VAT', () => {
		expect(vatAmountCents(960_000, 6)).toBe(57_600);
		expect(inclVatCents(960_000, 6)).toBe(1_017_600);
	});

	it('works back from an invoice total', () => {
		expect(exclVatCents(1_017_600, 6)).toBe(960_000);
		expect(exclVatCents(12_100, 21)).toBe(10_000);
	});
});

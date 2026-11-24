import { decryptSecret, encryptSecret } from '@@/server/utils/crypto';
import { createError } from 'h3';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const KEY = 'a-test-key-that-is-at-least-32-characters';

describe('token encryption', () => {
	beforeEach(() => {
		vi.stubGlobal('createError', createError);
	});

	it('round-trips a refresh token', async () => {
		const encrypted = await encryptSecret('1//refresh-token', KEY);

		expect(encrypted).not.toContain('refresh-token');
		await expect(decryptSecret(encrypted, KEY)).resolves.toBe('1//refresh-token');
	});

	it('uses a fresh IV every time', async () => {
		expect(await encryptSecret('same', KEY)).not.toBe(await encryptSecret('same', KEY));
	});

	it('refuses a wrong key', async () => {
		const encrypted = await encryptSecret('secret', KEY);

		await expect(decryptSecret(encrypted, `${KEY}-other`)).rejects.toThrow();
	});

	it('refuses a short key', async () => {
		await expect(encryptSecret('secret', 'short')).rejects.toThrow(/32 tekens/);
	});
});

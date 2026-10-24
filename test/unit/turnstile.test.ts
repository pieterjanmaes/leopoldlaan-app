import { validateTurnstile } from '@@/server/utils/turnstile';
import { createError } from 'h3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();

beforeEach(() => {
	// Nitro's auto-import, which plain Node does not have
	vi.stubGlobal('createError', createError);
	vi.stubGlobal('fetch', fetchMock);
	vi.stubEnv('NUXT_TURNSTILE_SECRET_KEY', 'secret-key');
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
	fetchMock.mockReset();
});

const respondWith = (body: unknown) => fetchMock.mockResolvedValue({ json: () => Promise.resolve(body) });

describe('validateTurnstile', () => {
	it('posts the secret and token to Cloudflare', async () => {
		respondWith({ success: true });

		await validateTurnstile('token-123');

		expect(fetchMock).toHaveBeenCalledWith('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ secret: 'secret-key', response: 'token-123' })
		});
	});

	it('returns what Cloudflare says', async () => {
		respondWith({ success: true });
		expect(await validateTurnstile('good')).toBe(true);

		respondWith({ success: false, 'error-codes': ['invalid-input-response'] });
		expect(await validateTurnstile('bad')).toBe(false);
	});

	it('fails with a 500 and never calls Cloudflare without a secret key', async () => {
		vi.stubEnv('NUXT_TURNSTILE_SECRET_KEY', '');

		await expect(validateTurnstile('token')).rejects.toMatchObject({ statusCode: 500 });
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

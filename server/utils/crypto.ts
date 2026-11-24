function toBase64(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
	return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function importKey(secret: string): Promise<CryptoKey> {
	if (secret.length < 32) {
		throw createError({ statusCode: 500, message: 'NUXT_DRIVE_TOKEN_KEY moet minstens 32 tekens lang zijn' });
	}
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));

	return await crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/** AES-GCM with a random IV; the result is "iv.ciphertext", both base64. */
export async function encryptSecret(plain: string, secret: string): Promise<string> {
	const key = await importKey(secret);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));

	return `${toBase64(iv)}.${toBase64(new Uint8Array(cipher))}`;
}

export async function decryptSecret(encrypted: string, secret: string): Promise<string> {
	const [iv, cipher] = encrypted.split('.');
	if (!iv || !cipher) {
		throw createError({ statusCode: 500, message: 'Versleutelde waarde is ongeldig' });
	}
	const key = await importKey(secret);
	const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(iv) }, key, fromBase64(cipher));

	return new TextDecoder().decode(plain);
}

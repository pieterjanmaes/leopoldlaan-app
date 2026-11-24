function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** URL-safe random secret, used for invite links and generated passwords. */
export function generateSecret(byteLength = 32): string {
	return toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

/** Invite tokens are stored as SHA-256 hashes; the plain token only lives in the link. */
export async function hashSecret(secret: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));

	return toBase64Url(new Uint8Array(digest));
}

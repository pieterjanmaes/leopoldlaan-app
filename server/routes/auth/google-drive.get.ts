import { sendRedirect, type RequestEvent } from 'nuxt/server';

/**
 * Connects the project's Google Drive. Only the owner does this once; everyone else reaches the files through
 * the server, so contractors don't need a Google account. Register `<site>/auth/google-drive` as redirect URI.
 */
const oauth = defineOAuthGoogleEventHandler({
	config: {
		scope: DRIVE_SCOPES,
		authorizationParams: {
			// offline + consent: Google only hands out a refresh token when the consent screen is shown.
			access_type: 'offline',
			prompt: 'consent'
		}
	},
	// nuxt-auth-utils 0.6 hands these callbacks a `nuxt/server` RequestEvent, so redirect with `nuxt/server` helpers.
	async onSuccess(event, { user: googleUser, tokens }) {
		if (!tokens.refresh_token) {
			return sendRedirect(event, '/instellingen?drive=no-refresh-token');
		}
		// The route handler below already checked the owner role against the database.
		const { user: owner } = await requireUserSession(event);

		await saveDriveConnection({
			googleEmail: googleUser.email,
			refreshToken: tokens.refresh_token,
			accessToken: tokens.access_token,
			expiresIn: tokens.expires_in,
			connectedBy: owner.id
		});
		await ensureRootFolder();

		return sendRedirect(event, '/instellingen?drive=connected');
	},
	onError(event, error) {
		console.error('Google Drive OAuth error', error);

		return sendRedirect(event, '/instellingen?drive=error');
	}
});

export default defineEventHandler(async (event) => {
	await requireOwner(event);

	// On Nuxt 4 this h3 event is what `nuxt/server` handlers receive at runtime (they fall back to `event.req.url`).
	return oauth(event as unknown as RequestEvent);
});

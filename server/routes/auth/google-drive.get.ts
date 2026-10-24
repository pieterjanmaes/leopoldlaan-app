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
	async onSuccess(event, { user: googleUser, tokens }) {
		const owner = await requireOwner(event);
		if (!tokens.refresh_token) {
			return sendRedirect(event, '/instellingen?drive=no-refresh-token');
		}

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

	return oauth(event);
});

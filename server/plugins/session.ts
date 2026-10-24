/**
 * The client refreshes its session through GET /api/_auth/session. Re-validate it there too, so a deleted user
 * or a session from before a password change is logged out on the next page load, and role changes show up.
 */
export default defineNitroPlugin(() => {
	sessionHooks.hook('fetch', async (session, event) => {
		if (!session.user) {
			return;
		}

		const user = await loadSessionUser(session.user.id, session.loggedInAt);
		if (!user) {
			await clearUserSession(event);
			throw createError({ statusCode: 401, message: 'Je sessie is verlopen, meld je opnieuw aan' });
		}

		Object.assign(session.user, user);
	});
});

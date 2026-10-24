/**
 * The `/dashboard/*` area is a non-localized admin section (each page uses
 * `defineI18nRoute(false)`). That correctly disables localized route *generation*,
 * so SSR / direct loads resolve the unprefixed URLs. But under `strategy: 'prefix'`
 * the i18n client runtime still runs `navigate()` after hydration and re-localizes
 * the current route — bouncing `/dashboard/login` to `/nl/dashboard/login`, which
 * the localized content catch-all renders as a 404.
 *
 * This guard cancels (does not redirect → no loop) any client navigation that
 * localizes a real, unprefixed dashboard route. When entering the dashboard from a
 * localized page, it does a full navigation to the unprefixed URL so the i18n SPA
 * guard can't re-localize it.
 */
export default defineNuxtPlugin(() => {
	const router = useRouter();

	// Matches `/nl/dashboard...` or `/fr/dashboard...`; captures the unprefixed `/dashboard...`.
	const LOCALIZED_DASHBOARD = /^\/(?:nl|fr)(\/dashboard(?:\/.*)?)$/;
	const UNPREFIXED_DASHBOARD = /^\/dashboard(?:\/|$)/;

	router.beforeEach((to, from) => {
		const match = to.path.match(LOCALIZED_DASHBOARD);
		const unprefixed = match?.[1];
		if (!unprefixed) return;

		// Only act for genuine dashboard pages, not the content catch-all (`/:slug(.*)*`).
		const resolved = router.resolve(unprefixed);
		const isRealDashboardRoute = resolved.matched.some((record) => !record.path.includes(':slug'));
		if (!isRealDashboardRoute) return;

		// TEMP: confirm the guard intercepts the redirect. Remove once verified.
		console.log('[dashboard-i18n-guard] blocking', from.path, '->', to.path);

		// Already inside the unprefixed dashboard → just cancel the localizing redirect.
		if (UNPREFIXED_DASHBOARD.test(from.path)) {
			return false;
		}

		// Entering from a localized page → hard-navigate to the unprefixed URL so the
		// i18n client guard can't re-localize it (a SPA redirect would loop).
		window.location.assign(unprefixed);
		return false;
	});
});

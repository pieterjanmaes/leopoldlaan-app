const PUBLIC_ROUTES = new Set(['/login', '/registreer']);

export default defineNuxtRouteMiddleware((to) => {
	const { loggedIn } = useUserSession();

	if (PUBLIC_ROUTES.has(to.path)) {
		return loggedIn.value ? navigateTo('/') : undefined;
	}

	if (!loggedIn.value) {
		return navigateTo({ path: '/login', query: to.fullPath === '/' ? undefined : { redirect: to.fullPath } });
	}
});

export default defineNuxtRouteMiddleware(() => {
	const { loggedIn, user } = useUserSession();

	if (!loggedIn.value) {
		return navigateTo('/dashboard/login');
	}

	if (user.value?.role !== 'superadmin') {
		return navigateTo('/dashboard');
	}
});

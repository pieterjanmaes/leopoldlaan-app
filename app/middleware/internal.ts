/** Pages for the household only; externals land on their tasks. */
export default defineNuxtRouteMiddleware(() => {
	const { user } = useUserSession();

	if (!isInternal(user.value)) {
		return navigateTo('/taken');
	}
});

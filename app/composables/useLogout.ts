export function useLogout() {
	const { clear } = useUserSession();

	return async () => {
		try {
			await $fetch('/api/auth/logout', { method: 'POST' });
		} finally {
			// Even if the request failed, the browser session and the cached data of this user must go.
			await clear();
			clearNuxtData();
			await navigateTo('/login');
		}
	};
}

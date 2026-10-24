export default defineNuxtPlugin(() => {
	const cookieFirst: any = useState('cookieFirst');
	// @ts-ignore
	if (typeof window.CookieFirst !== 'undefined') {
		// @ts-ignore
		cookieFirst.value = window.CookieFirst;
	} else {
		window.addEventListener('cf_init', () => {
			// @ts-ignore
			cookieFirst.value = window.CookieFirst;
		});
	}
});

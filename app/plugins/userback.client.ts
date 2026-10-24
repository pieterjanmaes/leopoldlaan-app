export default defineNuxtPlugin((nuxtApp) => {
	const config = useRuntimeConfig();

	nuxtApp.hook('app:mounted', async () => {
		if (config.public.userbackToken) {
			// Imported only when a token is set, so the widget stays out of the entry bundle.
			const { default: Userback } = await import('@userback/widget');
			// @ts-ignore
			nuxtApp.vueApp.use(Userback(config.public.userbackToken));
		}
	});
});

/** Starts listening for the browser's install event at boot; it fires once per page load and may beat the layout. */
export default defineNuxtPlugin(() => {
	usePwaInstall();
});

import VueKonva from 'vue-konva';

// Konva draws on <canvas>, so it only exists in the browser; floor plans render inside <ClientOnly>.
export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.use(VueKonva);
});

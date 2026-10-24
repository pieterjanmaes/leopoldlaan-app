import { createSharedComposable } from '@vueuse/core';

/** Chrome/Edge/Android fire this before showing their own install banner; we keep it to offer install from the menu. */
interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const _usePwaInstall = () => {
	const deferredPrompt = shallowRef<BeforeInstallPromptEvent | null>(null);
	const isStandalone = ref(false);
	const isIos = ref(false);

	if (import.meta.client) {
		const standaloneQuery = window.matchMedia('(display-mode: standalone)');
		isStandalone.value =
			standaloneQuery.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
		standaloneQuery.addEventListener('change', (event) => {
			isStandalone.value = event.matches;
		});
		// iPadOS reports itself as a Mac, so also check for touch support.
		isIos.value =
			/iphone|ipad|ipod/i.test(navigator.userAgent) ||
			(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

		// The inline script in nuxt.config's head catches the event early and parks it on window.
		const parked = window as Window & { __installPrompt?: BeforeInstallPromptEvent };
		const adoptParked = () => {
			if (parked.__installPrompt) deferredPrompt.value = parked.__installPrompt;
		};
		adoptParked();
		window.addEventListener('installpromptready', adoptParked);
		window.addEventListener('appinstalled', () => {
			deferredPrompt.value = null;
			parked.__installPrompt = undefined;
			isStandalone.value = true;
		});
	}

	/** Install is possible straight away (Chromium), or by hand via the share menu (Safari on iOS). */
	const canInstall = computed(() => !isStandalone.value && (Boolean(deferredPrompt.value) || isIos.value));
	const needsManualSteps = computed(() => !deferredPrompt.value && isIos.value);

	async function install(): Promise<boolean> {
		const prompt = deferredPrompt.value;
		if (!prompt) {
			return false;
		}
		await prompt.prompt();
		const { outcome } = await prompt.userChoice;
		// A prompt event can only be used once.
		deferredPrompt.value = null;
		(window as Window & { __installPrompt?: BeforeInstallPromptEvent }).__installPrompt = undefined;

		return outcome === 'accepted';
	}

	return { canInstall, needsManualSteps, isStandalone: readonly(isStandalone), install };
};

export const usePwaInstall = createSharedComposable(_usePwaInstall);

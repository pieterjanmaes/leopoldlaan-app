import { CInstallAppModal } from '#components';

/** One action for every platform: the browser's own install dialog, or step-by-step help on iOS. */
export function useInstallApp() {
	const { canInstall, needsManualSteps, install } = usePwaInstall();
	const modal = useOverlay().create(CInstallAppModal);
	const toast = useToast();

	async function installApp() {
		if (needsManualSteps.value) {
			await modal.open().result;
			return;
		}
		if (await install()) {
			toast.add({ title: 'De app staat op je toestel', color: 'success', icon: 'i-lucide-smartphone' });
		}
	}

	return { canInstall, installApp };
}

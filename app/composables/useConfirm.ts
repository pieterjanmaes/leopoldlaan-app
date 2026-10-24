import { CConfirmModal } from '#components';

/** Asks for confirmation in a modal; resolves to true only when the user confirms (dismissing counts as no). */
export function useConfirm() {
	const modal = useOverlay().create(CConfirmModal);

	return async (title: string, confirmLabel?: string): Promise<boolean> => {
		const result = await modal.open({ title, confirmLabel }).result;

		return result === true;
	};
}

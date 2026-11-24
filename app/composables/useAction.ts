import type { Ref } from 'vue';

export interface ActionOptions<Args extends unknown[], Result> {
	/** Toast shown after success; a function can use the result and the call's arguments. */
	success?: string | ((result: Result, ...args: Args) => string);
	/** Ask first; the action only runs when confirmed. Returns the question, optionally with the button label. */
	confirm?: (...args: Args) => string | { title: string; label?: string };
	onSuccess?: (result: Result, ...args: Args) => unknown;
	onError?: (error: unknown, ...args: Args) => unknown;
}

type Runner<Args extends unknown[], Result> = (...args: Args) => Promise<Result | undefined>;

function createRunner<Args extends unknown[], Result>(
	fn: (...args: Args) => Promise<Result>,
	options: ActionOptions<Args, Result>,
	isBusy: () => boolean,
	setBusy: (busy: boolean, args: Args) => void
): Runner<Args, Result> {
	const toast = useToast();
	const showError = useApiError();
	const confirm = useConfirm();

	return async (...args: Args) => {
		if (isBusy()) {
			return undefined;
		}
		if (options.confirm) {
			const question = options.confirm(...args);
			const { title, label } = typeof question === 'string' ? { title: question, label: undefined } : question;
			if (!(await confirm(title, label))) {
				return undefined;
			}
		}

		setBusy(true, args);
		try {
			const result = await fn(...args);
			if (options.success) {
				toast.add({
					title: typeof options.success === 'function' ? options.success(result, ...args) : options.success,
					color: 'success'
				});
			}
			await options.onSuccess?.(result, ...args);

			return result;
		} catch (error) {
			showError(error);
			await options.onError?.(error, ...args);

			return undefined;
		} finally {
			setBusy(false, args);
		}
	};
}

/**
 * Wraps a mutation: ignores calls while one is running, optionally asks for confirmation first, shows a success
 * toast and routes errors through useApiError(). `pending` drives the button's loading state.
 */
export function useAction<Args extends unknown[], Result>(
	fn: (...args: Args) => Promise<Result>,
	options: ActionOptions<Args, Result> = {}
) {
	const pending = ref(false);
	const run = createRunner(
		fn,
		options,
		() => pending.value,
		(busy) => {
			pending.value = busy;
		}
	);

	return { run, pending: readonly(pending) as Readonly<Ref<boolean>> };
}

/**
 * Like useAction, for lists where each row has its own spinner: `isPending(key)` says which row is busy.
 * The key function receives the call's arguments as a tuple: `([item]) => item.id`.
 */
export function useKeyedAction<Args extends unknown[], Result>(
	key: (args: NoInfer<Args>) => string,
	fn: (...args: Args) => Promise<Result>,
	options: ActionOptions<Args, Result> = {}
) {
	const pendingKey = ref<string | null>(null);
	const run = createRunner(
		fn,
		options,
		() => pendingKey.value !== null,
		(busy, args) => {
			pendingKey.value = busy ? key(args) : null;
		}
	);

	return {
		run,
		pendingKey: readonly(pendingKey) as Readonly<Ref<string | null>>,
		isPending: (value: string) => pendingKey.value === value
	};
}

interface FetchErrorLike {
	data?: { message?: string };
	message?: string;
}

/** Shows an API error as a toast, preferring the (Dutch) message the server sent. Usable outside component setup. */
export function useApiError() {
	const toast = useToast();

	return (error: unknown) => {
		const fetchError = error as FetchErrorLike;
		toast.add({
			title: fetchError.data?.message ?? 'Er ging iets mis, probeer opnieuw',
			color: 'error',
			icon: 'i-lucide-circle-alert'
		});
	};
}

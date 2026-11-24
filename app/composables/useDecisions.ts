/** All decisions, shared under one key by the decisions page, the floor plan and the search palette. */
export function useDecisions(options: { immediate?: boolean } = {}) {
	const { data, refresh, status } = useFetch<DecisionView[]>('/api/decisions', {
		key: 'decisions',
		default: () => [],
		immediate: options.immediate ?? true
	});

	return { decisions: data, refresh, status };
}

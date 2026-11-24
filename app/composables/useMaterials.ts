/** The shopping list, shared by the purchases page, the floor plan and the budget. */
export function useMaterials() {
	const { data, refresh, status } = useFetch<MaterialView[]>('/api/materials', { key: 'materials', default: () => [] });

	return { materials: data, refresh, status };
}

/** Rooms, categories, phases, contacts and users, shared by every screen under one cache key. */
export function useLookups() {
	const { data, refresh } = useFetch<Lookups>('/api/lookups', {
		key: 'lookups',
		default: () => ({ rooms: [], categories: [], phases: [], contacts: [], users: [] })
	});

	const byId = <T extends { id: string }>(items: () => T[]) =>
		computed(() => new Map(items().map((item) => [item.id, item])));

	const rooms = byId(() => data.value.rooms);
	const categories = byId(() => data.value.categories);
	const phases = byId(() => data.value.phases);
	const contacts = byId(() => data.value.contacts);
	const users = byId(() => data.value.users);

	const toOptions = (items: { id: string; name: string }[]) =>
		items.map((item) => ({ label: item.name, value: item.id }));

	return {
		lookups: data,
		refresh,
		rooms,
		categories,
		phases,
		contacts,
		users,
		roomOptions: computed(() => toOptions(data.value.rooms)),
		categoryOptions: computed(() => toOptions(data.value.categories)),
		phaseOptions: computed(() => toOptions(data.value.phases.filter((phase) => !phase.isMilestone))),
		contactOptions: computed(() =>
			data.value.contacts.map((contact) => ({
				label: contact.company ? `${contact.name} (${contact.company})` : contact.name,
				value: contact.id
			}))
		),
		userOptions: computed(() => toOptions(data.value.users))
	};
}

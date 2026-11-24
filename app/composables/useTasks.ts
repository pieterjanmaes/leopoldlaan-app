/** All tasks the user can see, shared under one key so the layout's search and the pages stay in sync. */
export function useTasks() {
	const { data, refresh, status } = useFetch<TaskView[]>('/api/tasks', { key: 'tasks', default: () => [] });

	const byId = computed(() => new Map(data.value.map((task) => [task.id, task])));
	const statusById = computed(() => new Map(data.value.map((task) => [task.id, task.status])));

	return { tasks: data, refresh, status, byId, statusById };
}

/** Assignee is either a household member or a contact; selects use one prefixed value for both. */
export function assigneeValue(task: Pick<TaskView, 'assigneeUserId' | 'assigneeContactId'>): string | undefined {
	if (task.assigneeUserId) return `user:${task.assigneeUserId}`;
	if (task.assigneeContactId) return `contact:${task.assigneeContactId}`;

	return undefined;
}

export function parseAssignee(value: string | null | undefined): {
	assigneeUserId: string | null;
	assigneeContactId: string | null;
} {
	if (value?.startsWith('user:')) return { assigneeUserId: value.slice(5), assigneeContactId: null };
	if (value?.startsWith('contact:')) return { assigneeUserId: null, assigneeContactId: value.slice(8) };

	return { assigneeUserId: null, assigneeContactId: null };
}

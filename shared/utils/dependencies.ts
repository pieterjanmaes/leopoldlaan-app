import type { TaskStatus } from './constants';

export interface ScheduledTask {
	id: string;
	status: TaskStatus;
	startDate: string | null;
	dueDate: string | null;
	dependsOn: string[];
}

export interface DependencyIssue {
	taskId: string;
	dependsOnTaskId: string;
	kind: 'starts-before-predecessor-ends' | 'predecessor-open';
}

/**
 * Finds tasks that are scheduled to start before a task they depend on is due, or that are already underway
 * while a predecessor is not done.
 */
export function findDependencyIssues(tasks: ScheduledTask[]): DependencyIssue[] {
	const byId = new Map(tasks.map((task) => [task.id, task]));
	const issues: DependencyIssue[] = [];

	for (const task of tasks) {
		if (task.status === 'done') {
			continue;
		}
		for (const predecessorId of task.dependsOn) {
			const predecessor = byId.get(predecessorId);
			if (!predecessor || predecessor.status === 'done') {
				continue;
			}
			if (task.status === 'in_progress') {
				issues.push({ taskId: task.id, dependsOnTaskId: predecessorId, kind: 'predecessor-open' });
				continue;
			}
			const predecessorEnd = predecessor.dueDate ?? predecessor.startDate;
			if (task.startDate && predecessorEnd && task.startDate < predecessorEnd) {
				issues.push({ taskId: task.id, dependsOnTaskId: predecessorId, kind: 'starts-before-predecessor-ends' });
			}
		}
	}

	return issues;
}

/** True when adding "taskId depends on dependsOnId" would create a cycle. */
export function wouldCreateCycle(
	dependencies: { taskId: string; dependsOnTaskId: string }[],
	taskId: string,
	dependsOnId: string
): boolean {
	if (taskId === dependsOnId) {
		return true;
	}

	const edges = new Map<string, string[]>();
	for (const dependency of dependencies) {
		edges.set(dependency.taskId, [...(edges.get(dependency.taskId) ?? []), dependency.dependsOnTaskId]);
	}

	// Walk from the new predecessor: if it (transitively) depends on taskId, the new edge closes a loop.
	const stack = [dependsOnId];
	const seen = new Set<string>();
	while (stack.length > 0) {
		const current = stack.pop() as string;
		if (current === taskId) {
			return true;
		}
		if (seen.has(current)) {
			continue;
		}
		seen.add(current);
		stack.push(...(edges.get(current) ?? []));
	}

	return false;
}

/** A task is blocked while any of its predecessors is not done. */
export function isBlocked(task: Pick<ScheduledTask, 'dependsOn'>, statusById: Map<string, TaskStatus>): boolean {
	return task.dependsOn.some((id) => {
		const status = statusById.get(id);
		return status !== undefined && status !== 'done';
	});
}

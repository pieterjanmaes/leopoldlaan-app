import { findDependencyIssues, isBlocked, wouldCreateCycle } from '@@/shared/utils/dependencies';
import { describe, expect, it } from 'vitest';

describe('wouldCreateCycle', () => {
	const edges = [
		{ taskId: 'plaster', dependsOnTaskId: 'electricity' },
		{ taskId: 'paint', dependsOnTaskId: 'plaster' }
	];

	it('refuses a task depending on itself', () => {
		expect(wouldCreateCycle([], 'a', 'a')).toBe(true);
	});

	it('refuses an edge that closes a loop', () => {
		expect(wouldCreateCycle(edges, 'electricity', 'paint')).toBe(true);
	});

	it('allows an edge in the same direction', () => {
		expect(wouldCreateCycle(edges, 'paint', 'electricity')).toBe(false);
	});
});

describe('findDependencyIssues', () => {
	it('flags a task planned to start before its predecessor is due', () => {
		const issues = findDependencyIssues([
			{ id: 'electricity', status: 'todo', startDate: '2026-11-01', dueDate: '2026-11-10', dependsOn: [] },
			{ id: 'plaster', status: 'todo', startDate: '2026-11-05', dueDate: '2026-11-12', dependsOn: ['electricity'] }
		]);

		expect(issues).toEqual([
			{ taskId: 'plaster', dependsOnTaskId: 'electricity', kind: 'starts-before-predecessor-ends' }
		]);
	});

	it('ignores predecessors that are done', () => {
		const issues = findDependencyIssues([
			{ id: 'electricity', status: 'done', startDate: '2026-11-01', dueDate: '2026-11-10', dependsOn: [] },
			{ id: 'plaster', status: 'in_progress', startDate: '2026-11-05', dueDate: null, dependsOn: ['electricity'] }
		]);

		expect(issues).toEqual([]);
	});
});

describe('isBlocked', () => {
	it('is blocked while a predecessor is open', () => {
		const statuses = new Map([
			['a', 'done' as const],
			['b', 'in_progress' as const]
		]);

		expect(isBlocked({ dependsOn: ['a'] }, statuses)).toBe(false);
		expect(isBlocked({ dependsOn: ['a', 'b'] }, statuses)).toBe(true);
	});
});

import { db } from 'hub:db';

import type { User as SessionUser } from '#auth-utils';

import { wouldCreateCycle } from '../../shared/utils/dependencies';
import { isInternal } from '../../shared/utils/permissions';
import { and, asc, eq, inArray, or, sql, tables, type Task } from './drizzle';

/** Externals only see tasks assigned to them, either as a user or through their contact. */
export function taskVisibility(user: SessionUser) {
	if (isInternal(user)) {
		return undefined;
	}

	const mine = eq(tables.tasks.assigneeUserId, user.id);

	return user.contactId ? or(mine, eq(tables.tasks.assigneeContactId, user.contactId)) : mine;
}

function toIso(date: Date | null): string | null {
	return date ? date.toISOString() : null;
}

export function toTaskView(
	task: Task,
	extra: { dependsOn?: string[]; commentCount?: number; attachmentCount?: number } = {}
): TaskView {
	return {
		id: task.id,
		title: task.title,
		description: task.description,
		status: task.status,
		priority: task.priority,
		roomId: task.roomId,
		categoryId: task.categoryId,
		phaseId: task.phaseId,
		assigneeUserId: task.assigneeUserId,
		assigneeContactId: task.assigneeContactId,
		startDate: task.startDate,
		dueDate: task.dueDate,
		doneAt: toIso(task.doneAt),
		sortOrder: task.sortOrder,
		dependsOn: extra.dependsOn ?? [],
		commentCount: extra.commentCount ?? 0,
		attachmentCount: extra.attachmentCount ?? 0,
		createdAt: task.createdAt.toISOString()
	};
}

async function countBy(ids: string[], kind: 'comments' | 'attachments'): Promise<Map<string, number>> {
	if (ids.length === 0) {
		return new Map();
	}

	// A subquery on the task ids instead of a bound list keeps us under D1's parameter limit.
	const rows =
		kind === 'comments'
			? await db
					.select({ id: tables.taskComments.taskId, count: sql<number>`count(*)` })
					.from(tables.taskComments)
					.groupBy(tables.taskComments.taskId)
			: await db
					.select({ id: tables.attachments.entityId, count: sql<number>`count(*)` })
					.from(tables.attachments)
					.where(eq(tables.attachments.entityType, 'task'))
					.groupBy(tables.attachments.entityId);
	const wanted = new Set(ids);

	return new Map(rows.filter((row) => wanted.has(row.id)).map((row) => [row.id, row.count]));
}

async function dependenciesOf(ids: string[]): Promise<Map<string, string[]>> {
	const map = new Map<string, string[]>();
	if (ids.length === 0) {
		return map;
	}

	const rows = await db.select().from(tables.taskDependencies);
	const wanted = new Set(ids);
	for (const row of rows) {
		if (wanted.has(row.taskId)) {
			map.set(row.taskId, [...(map.get(row.taskId) ?? []), row.dependsOnTaskId]);
		}
	}

	return map;
}

export async function hydrateTasks(rows: Task[]): Promise<TaskView[]> {
	const ids = rows.map((task) => task.id);
	const [dependencies, comments, attachments] = await Promise.all([
		dependenciesOf(ids),
		countBy(ids, 'comments'),
		countBy(ids, 'attachments')
	]);

	return rows.map((task) =>
		toTaskView(task, {
			dependsOn: dependencies.get(task.id) ?? [],
			commentCount: comments.get(task.id) ?? 0,
			attachmentCount: attachments.get(task.id) ?? 0
		})
	);
}

export async function listTasks(user: SessionUser): Promise<TaskView[]> {
	const rows = await db
		.select()
		.from(tables.tasks)
		.where(taskVisibility(user))
		.orderBy(asc(tables.tasks.sortOrder), asc(tables.tasks.createdAt));

	return await hydrateTasks(rows);
}

export async function findVisibleTask(user: SessionUser, id: string): Promise<Task> {
	const task = await db
		.select()
		.from(tables.tasks)
		.where(and(eq(tables.tasks.id, id), taskVisibility(user)))
		.get();
	if (!task) {
		throw createError({ statusCode: 404, message: 'Taak niet gevonden' });
	}

	return task;
}

export async function setDependencies(taskId: string, dependsOn: string[]): Promise<void> {
	const unique = [...new Set(dependsOn)];
	const existing = await db.select().from(tables.taskDependencies);
	const others = existing.filter((row) => row.taskId !== taskId);

	for (const dependsOnId of unique) {
		if (wouldCreateCycle(others, taskId, dependsOnId)) {
			throw createError({ statusCode: 400, message: 'Deze afhankelijkheid zou een kringloop maken' });
		}
		others.push({ taskId, dependsOnTaskId: dependsOnId });
	}

	if (unique.length > 0) {
		const found = await db.select({ id: tables.tasks.id }).from(tables.tasks).where(inArray(tables.tasks.id, unique));
		if (found.length !== unique.length) {
			throw createError({ statusCode: 400, message: 'Een van de gekoppelde taken bestaat niet meer' });
		}
	}

	await db.batch([
		db.delete(tables.taskDependencies).where(eq(tables.taskDependencies.taskId, taskId)),
		...unique.map((dependsOnTaskId) => db.insert(tables.taskDependencies).values({ taskId, dependsOnTaskId }))
	] as [never, ...never[]]);
}

/** doneAt follows the status, so "finished this week" stays accurate. */
export function doneAtFor(status: TaskStatus | undefined, current: Task | null): Date | null | undefined {
	if (status === undefined) {
		return undefined;
	}
	if (status === 'done') {
		return current?.status === 'done' ? current.doneAt : new Date();
	}

	return null;
}

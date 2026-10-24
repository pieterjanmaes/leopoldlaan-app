import { db } from 'hub:db';

import { TASK_STATUSES } from '../../shared/utils/constants';
import { addDays, startOfWeek, todayIso } from '../../shared/utils/dates';
import { isBlocked } from '../../shared/utils/dependencies';
import { isInternal } from '../../shared/utils/permissions';
import { desc, tables } from '../utils/drizzle';

const LIST_LIMIT = 8;
const TIME_ZONE = 'Europe/Brussels';
const SOON_DAYS = 14;

function overlapsWeek(task: TaskView, monday: string, sunday: string): boolean {
	if (task.status === 'in_progress') {
		return true;
	}
	const start = task.startDate ?? task.dueDate;
	const end = task.dueDate ?? task.startDate;

	return Boolean(start && end && start <= sunday && end >= monday);
}

export default defineEventHandler(async (event): Promise<DashboardView> => {
	const user = await requireUser(event);
	const internal = isInternal(user);
	const [project, tasks] = await Promise.all([getProject(), listTasks(user)]);

	const today = todayIso(TIME_ZONE);
	const monday = startOfWeek(today);
	const sunday = addDays(monday, 6);
	const soon = addDays(today, SOON_DAYS);
	const statusById = new Map(tasks.map((task) => [task.id, task.status]));
	const open = tasks.filter((task) => task.status !== 'done');

	const taskCounts = Object.fromEntries(
		TASK_STATUSES.map((status) => [status, tasks.filter((task) => task.status === status).length])
	) as Record<TaskStatus, number>;

	let budget: DashboardView['budget'] = null;
	if (internal) {
		const overview = await getBudgetOverview();
		const unpaid = overview.expenses.filter((expense) => !expense.paidOn);
		budget = {
			totals: overview.totals,
			categories: overview.categories,
			unpaidCount: unpaid.length,
			unpaidCents: unpaid.reduce((total, expense) => total + expense.amountInclCents, 0)
		};
	}

	const visibleTaskIds = new Set(tasks.map((task) => task.id));
	const attachments = await db
		.select()
		.from(tables.attachments)
		.orderBy(desc(tables.attachments.createdAt))
		.limit(internal ? LIST_LIMIT : 200);
	const recentFiles = attachments
		.filter((attachment) => internal || (attachment.entityType === 'task' && visibleTaskIds.has(attachment.entityId)))
		.slice(0, LIST_LIMIT)
		.map(toAttachmentView);

	return {
		project,
		taskCounts,
		thisWeek: open.filter((task) => overlapsWeek(task, monday, sunday)).slice(0, LIST_LIMIT),
		overdue: open.filter((task) => task.dueDate && task.dueDate < today).slice(0, LIST_LIMIT),
		// Only blockers that matter soon; far-future tasks waiting on each other are just the plan.
		blocked: open
			.filter((task) => isBlocked(task, statusById) && (!task.startDate || task.startDate <= soon))
			.slice(0, LIST_LIMIT),
		budget,
		recentFiles
	};
});

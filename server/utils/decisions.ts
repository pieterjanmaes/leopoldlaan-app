import { db } from 'hub:db';

import type { User as SessionUser } from '#auth-utils';

import { todayIso } from '../../shared/utils/dates';
import { asc, desc, eq, sql, tables, type Decision } from './drizzle';

const TIME_ZONE = 'Europe/Brussels';

export function toDecisionView(
	decision: Decision,
	extra: { decidedByName?: string | null; attachmentCount?: number } = {}
): DecisionView {
	return {
		id: decision.id,
		title: decision.title,
		body: decision.body,
		status: decision.status,
		deadline: decision.deadline,
		decidedOn: decision.decidedOn,
		decidedBy: decision.decidedBy && extra.decidedByName ? { id: decision.decidedBy, name: extra.decidedByName } : null,
		roomId: decision.roomId,
		categoryId: decision.categoryId,
		taskId: decision.taskId,
		contactId: decision.contactId,
		reference: decision.reference,
		attachmentCount: extra.attachmentCount ?? 0,
		updatedAt: decision.updatedAt.toISOString()
	};
}

/** Open decisions first (soonest deadline on top), then the rest, newest decision first. */
export async function listDecisions(): Promise<DecisionView[]> {
	const [rows, files] = await Promise.all([
		db
			.select({ decision: tables.decisions, decidedByName: tables.users.name })
			.from(tables.decisions)
			.leftJoin(tables.users, eq(tables.users.id, tables.decisions.decidedBy))
			.orderBy(
				asc(sql`case ${tables.decisions.status} when 'open' then 0 when 'decided' then 1 else 2 end`),
				asc(sql`coalesce(${tables.decisions.deadline}, '9999-12-31')`),
				desc(sql`coalesce(${tables.decisions.decidedOn}, '')`),
				desc(tables.decisions.updatedAt)
			),
		db
			.select({ id: tables.attachments.entityId, count: sql<number>`count(*)` })
			.from(tables.attachments)
			.where(eq(tables.attachments.entityType, 'decision'))
			.groupBy(tables.attachments.entityId)
	]);
	const counts = new Map(files.map((row) => [row.id, row.count]));

	return rows.map(({ decision, decidedByName }) =>
		toDecisionView(decision, { decidedByName, attachmentCount: counts.get(decision.id) ?? 0 })
	);
}

/**
 * Deciding stamps who and when (unless given), so "decided on" is never forgotten; reopening clears both.
 */
export function decisionStamps(
	user: SessionUser,
	next: { status?: DecisionStatus; decidedOn?: string | null },
	current: Pick<Decision, 'status' | 'decidedOn' | 'decidedBy'> | null
): { decidedOn?: string | null; decidedBy?: string | null } {
	if (next.status === undefined || next.status === current?.status) {
		return next.decidedOn === undefined ? {} : { decidedOn: next.decidedOn };
	}
	if (next.status === 'open') {
		return { decidedOn: null, decidedBy: null };
	}
	if (next.status === 'decided') {
		return { decidedOn: next.decidedOn ?? current?.decidedOn ?? todayIso(TIME_ZONE), decidedBy: user.id };
	}

	return {};
}

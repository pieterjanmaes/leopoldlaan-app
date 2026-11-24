import { db } from 'hub:db';

import { todayIso } from '../../shared/utils/dates';
import { materialTotalCents } from '../../shared/utils/materials';
import { asc, tables, type Material } from './drizzle';

const TIME_ZONE = 'Europe/Brussels';

export function toMaterialView(
	material: Material,
	taskStartById: Map<string, string | null> = new Map()
): MaterialView {
	return {
		id: material.id,
		name: material.name,
		quantity: material.quantity,
		unit: material.unit,
		unitPriceCents: material.unitPriceCents,
		totalCents: materialTotalCents(material.quantity, material.unitPriceCents),
		status: material.status,
		neededBy: material.neededBy,
		effectiveNeededBy: material.neededBy ?? (material.taskId ? (taskStartById.get(material.taskId) ?? null) : null),
		orderedOn: material.orderedOn,
		deliveredOn: material.deliveredOn,
		roomId: material.roomId,
		categoryId: material.categoryId,
		contactId: material.contactId,
		taskId: material.taskId,
		decisionId: material.decisionId,
		expenseId: material.expenseId,
		url: material.url,
		notes: material.notes
	};
}

export async function taskStartDates(): Promise<Map<string, string | null>> {
	const rows = await db.select({ id: tables.tasks.id, startDate: tables.tasks.startDate }).from(tables.tasks);

	return new Map(rows.map((row) => [row.id, row.startDate]));
}

/** Most urgent first: by status, then by when it's needed on site. */
export async function listMaterials(): Promise<MaterialView[]> {
	const [rows, starts] = await Promise.all([
		db.select().from(tables.materials).orderBy(asc(tables.materials.sortOrder), asc(tables.materials.createdAt)),
		taskStartDates()
	]);
	const statusOrder = { needed: 0, ordered: 1, delivered: 2 } as const;

	return rows
		.map((row) => toMaterialView(row, starts))
		.sort(
			(a, b) =>
				statusOrder[a.status] - statusOrder[b.status] ||
				(a.effectiveNeededBy ?? '9999').localeCompare(b.effectiveNeededBy ?? '9999')
		);
}

/** Moving along the list fills in the dates; moving back clears the ones that no longer apply. */
export function materialStamps(
	next: { status?: MaterialStatus; orderedOn?: string | null; deliveredOn?: string | null },
	current: Pick<Material, 'status' | 'orderedOn' | 'deliveredOn'> | null
): { orderedOn?: string | null; deliveredOn?: string | null } {
	if (next.status === undefined || next.status === current?.status) {
		return {};
	}

	const today = todayIso(TIME_ZONE);
	if (next.status === 'needed') {
		return { orderedOn: null, deliveredOn: null };
	}
	if (next.status === 'ordered') {
		return { orderedOn: next.orderedOn ?? current?.orderedOn ?? today, deliveredOn: null };
	}

	return {
		orderedOn: next.orderedOn ?? current?.orderedOn ?? today,
		deliveredOn: next.deliveredOn ?? current?.deliveredOn ?? today
	};
}

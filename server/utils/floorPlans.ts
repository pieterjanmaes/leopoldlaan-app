import { db } from 'hub:db';

import type { User as SessionUser } from '#auth-utils';

import { asc, tables, type FloorPlan, type PlanMarker } from './drizzle';

export function toPlanMarkerView(marker: PlanMarker): PlanMarkerView {
	return {
		id: marker.id,
		floorPlanId: marker.floorPlanId,
		kind: marker.kind,
		label: marker.label,
		note: marker.note,
		color: marker.color,
		points: marker.points,
		roomId: marker.roomId,
		taskId: marker.taskId
	};
}

export function toFloorPlanView(plan: FloorPlan, markers: PlanMarker[] = []): FloorPlanView {
	return {
		id: plan.id,
		name: plan.name,
		backgroundFileId: plan.backgroundFileId,
		backgroundName: plan.backgroundName,
		aspectRatio: plan.aspectRatio,
		sortOrder: plan.sortOrder,
		markers: markers.filter((marker) => marker.floorPlanId === plan.id).map(toPlanMarkerView)
	};
}

export async function listFloorPlans(): Promise<FloorPlanView[]> {
	const [plans, markers] = await Promise.all([
		db.select().from(tables.floorPlans).orderBy(asc(tables.floorPlans.sortOrder), asc(tables.floorPlans.createdAt)),
		db.select().from(tables.planMarkers).orderBy(asc(tables.planMarkers.createdAt))
	]);

	return plans.map((plan) => toFloorPlanView(plan, markers));
}

/** Checks a picked background is reachable and returns its name; the plan only stores a reference. */
export async function resolveBackground(
	user: SessionUser,
	fileId: string | null | undefined
): Promise<{ backgroundFileId?: string | null; backgroundName?: string | null }> {
	if (fileId === undefined) {
		return {};
	}
	if (fileId === null) {
		return { backgroundFileId: null, backgroundName: null };
	}

	await assertCanAccessFile(user, fileId);
	const file = await getDriveFile(fileId);
	if (!file.mimeType.startsWith('image/')) {
		throw createError({ statusCode: 400, message: 'Kies een afbeelding (PNG, JPG of SVG) als plan' });
	}

	return { backgroundFileId: file.id, backgroundName: file.name };
}

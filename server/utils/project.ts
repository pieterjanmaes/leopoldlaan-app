import { db } from 'hub:db';

import { eq, tables } from './drizzle';

/** The project row is created on first read, so a fresh database needs no seeding to work. */
export async function getProject(): Promise<ProjectView> {
	let row = await db.select().from(tables.project).where(eq(tables.project.id, 'main')).get();
	if (!row) {
		row = await db.insert(tables.project).values({ id: 'main' }).onConflictDoNothing().returning().get();
		row ??= await db.select().from(tables.project).where(eq(tables.project.id, 'main')).get();
	}
	if (!row) {
		throw createError({ statusCode: 500, message: 'Project kon niet geladen worden' });
	}

	return {
		name: row.name,
		address: row.address,
		startDate: row.startDate,
		targetEndDate: row.targetEndDate,
		contingencyPercent: row.contingencyPercent
	};
}

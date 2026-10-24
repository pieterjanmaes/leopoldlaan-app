import { db } from 'hub:db';

import { addDays, todayIso } from '../../shared/utils/dates';
import { eq, sql, tables } from '../utils/drizzle';

// Dev defaults; set SEED_OWNER_EMAIL / SEED_OWNER_PASSWORD for a deployed environment.
const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL || 'eigenaar@leopoldlaan.test';
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD || 'changeme123';
const OWNER_NAME = process.env.SEED_OWNER_NAME || 'Eigenaar';

/** Werkposten in the order they usually happen on a Belgian renovation. */
const CATEGORIES = [
	{ name: 'Sloop & afbraak', color: 'stone', icon: 'i-lucide-hammer' },
	{ name: 'Ruwbouw & structuur', color: 'orange', icon: 'i-lucide-brick-wall' },
	{ name: 'Dak', color: 'red', icon: 'i-lucide-house' },
	{ name: 'Isolatie', color: 'yellow', icon: 'i-lucide-layers' },
	{ name: 'Ramen & deuren', color: 'sky', icon: 'i-lucide-door-open' },
	{ name: 'Elektriciteit', color: 'amber', icon: 'i-lucide-zap' },
	{ name: 'Sanitair', color: 'blue', icon: 'i-lucide-droplets' },
	{ name: 'Verwarming & ventilatie', color: 'rose', icon: 'i-lucide-heater' },
	{ name: 'Pleisterwerk', color: 'pink', icon: 'i-lucide-paint-roller' },
	{ name: 'Chape & vloeren', color: 'teal', icon: 'i-lucide-grid-3x3' },
	{ name: 'Keuken', color: 'emerald', icon: 'i-lucide-chef-hat' },
	{ name: 'Badkamer', color: 'cyan', icon: 'i-lucide-bath' },
	{ name: 'Schilderwerk', color: 'violet', icon: 'i-lucide-paintbrush' },
	{ name: 'Tuin & buitenaanleg', color: 'green', icon: 'i-lucide-trees' },
	{ name: 'Administratie & premies', color: 'indigo', icon: 'i-lucide-file-text' }
] as const;

const ROOMS = [
	{ name: 'Inkomhal', floor: 'Gelijkvloers' },
	{ name: 'Woonkamer', floor: 'Gelijkvloers' },
	{ name: 'Keuken', floor: 'Gelijkvloers' },
	{ name: 'Toilet', floor: 'Gelijkvloers' },
	{ name: 'Slaapkamer 1', floor: 'Eerste verdieping' },
	{ name: 'Slaapkamer 2', floor: 'Eerste verdieping' },
	{ name: 'Badkamer', floor: 'Eerste verdieping' },
	{ name: 'Zolder', floor: 'Zolder' },
	{ name: 'Kelder', floor: 'Kelder' },
	{ name: 'Tuin', floor: 'Buiten' }
];

/** Phases with offsets in weeks from today, and the tasks that start them off. */
const PHASES = [
	{
		name: 'Voorbereiding & vergunningen',
		weeks: [0, 4],
		tasks: ['Offertes opvragen', 'Asbestinventaris laten opmaken']
	},
	{ name: 'Sloop', weeks: [4, 6], tasks: ['Afbraak binnenmuren', 'Container bestellen'] },
	{ name: 'Ruwbouw, dak & isolatie', weeks: [6, 12], tasks: ['Dak vernieuwen', 'Dak isoleren'] },
	{ name: 'Technieken (ruw)', weeks: [12, 16], tasks: ['Elektriciteit ruw', 'Sanitair ruw'] },
	{ name: 'Afwerking', weeks: [16, 26], tasks: ['Pleisterwerk', 'Chape gieten', 'Vloeren leggen', 'Schilderwerk'] }
] as const;

const MILESTONES = [
	{ name: 'Keuring elektriciteit (AREI)', week: 16 },
	{ name: 'Verhuis', week: 27 }
];

const OPEN_DECISIONS = [
	{
		title: 'Verwarming: warmtepomp, gas of hybride',
		body: 'Bepaalt de leidingen, de vloerverwarming en de elektrische aansluiting. Vergelijk ook de premies.',
		category: 'Verwarming & ventilatie',
		week: 8
	},
	{
		title: 'Ventilatie: systeem C of D',
		body: 'Kanalen moeten vóór het pleisterwerk liggen. Systeem D is duurder maar zuiniger bij een goed geïsoleerd huis.',
		category: 'Verwarming & ventilatie',
		week: 10
	},
	{
		title: 'Stopcontacten en lichtpunten per ruimte',
		body: 'Duid ze aan op het grondplan voor de elektricien begint.',
		category: 'Elektriciteit',
		week: 11
	},
	{
		title: 'Vloerbekleding gelijkvloers',
		body: 'Tegels, parket of gietvloer? Bepaalt de dikte van de chape.',
		category: 'Chape & vloeren',
		week: 14
	},
	{ title: 'Keuken: leverancier en opstelling', body: null, category: 'Keuken', week: 16 }
] as const;

function isEmpty(table: typeof tables.categories | typeof tables.rooms | typeof tables.phases) {
	return db
		.select({ count: sql<number>`count(*)` })
		.from(table)
		.get()
		.then((row) => (row?.count ?? 0) === 0);
}

async function seedOwner(): Promise<{ id: string; created: boolean }> {
	const existing = await db.select().from(tables.users).where(eq(tables.users.email, OWNER_EMAIL)).get();
	if (existing) {
		return { id: existing.id, created: false };
	}

	const owner = await db
		.insert(tables.users)
		.values({ email: OWNER_EMAIL, password: await hashPassword(OWNER_PASSWORD), name: OWNER_NAME, role: 'owner' })
		.returning()
		.get();

	return { id: owner.id, created: true };
}

async function seedStructure(ownerId: string): Promise<boolean> {
	if (!(await isEmpty(tables.categories)) || !(await isEmpty(tables.phases))) {
		return false;
	}

	const today = todayIso('Europe/Brussels');
	const week = (count: number) => addDays(today, count * 7);

	const categories = await db
		.insert(tables.categories)
		.values(CATEGORIES.map((category, index) => ({ ...category, sortOrder: index })))
		.returning();
	const categoryId = (name: string) => categories.find((category) => category.name === name)?.id ?? null;
	await db.insert(tables.rooms).values(ROOMS.map((room, index) => ({ ...room, sortOrder: index })));

	const taskCategory: Record<string, string> = {
		'Offertes opvragen': 'Administratie & premies',
		'Asbestinventaris laten opmaken': 'Administratie & premies',
		'Afbraak binnenmuren': 'Sloop & afbraak',
		'Container bestellen': 'Sloop & afbraak',
		'Dak vernieuwen': 'Dak',
		'Dak isoleren': 'Isolatie',
		'Elektriciteit ruw': 'Elektriciteit',
		'Sanitair ruw': 'Sanitair',
		Pleisterwerk: 'Pleisterwerk',
		'Chape gieten': 'Chape & vloeren',
		'Vloeren leggen': 'Chape & vloeren',
		Schilderwerk: 'Schilderwerk'
	};

	// Each task depends on the previous one, so the timeline shows the usual order of work.
	let previousTaskId: string | null = null;
	let sortOrder = 0;
	for (const [phaseIndex, phase] of PHASES.entries()) {
		const [start, end] = phase.weeks;
		const created = await db
			.insert(tables.phases)
			.values({ name: phase.name, startDate: week(start), endDate: week(end), sortOrder: phaseIndex })
			.returning()
			.get();
		const span = Math.max(Math.floor(((end - start) * 7) / phase.tasks.length), 3);

		for (const [taskIndex, title] of phase.tasks.entries()) {
			const startDate = addDays(week(start), taskIndex * span);
			const task = await db
				.insert(tables.tasks)
				.values({
					title,
					phaseId: created.id,
					categoryId: categoryId(taskCategory[title] ?? ''),
					startDate,
					dueDate: addDays(startDate, span - 1),
					sortOrder: ++sortOrder,
					createdBy: ownerId
				})
				.returning()
				.get();
			if (previousTaskId) {
				await db.insert(tables.taskDependencies).values({ taskId: task.id, dependsOnTaskId: previousTaskId });
			}
			previousTaskId = task.id;
		}
	}

	await db.insert(tables.phases).values(
		MILESTONES.map((milestone, index) => ({
			name: milestone.name,
			startDate: week(milestone.week),
			endDate: week(milestone.week),
			isMilestone: true,
			sortOrder: PHASES.length + index
		}))
	);

	await db.insert(tables.subsidies).values([
		{
			name: 'Mijn VerbouwPremie – dakisolatie',
			categoryId: categoryId('Isolatie'),
			expectedCents: 0,
			notes: 'Aanvragen binnen 2 jaar na de eindfactuur via mijnverbouwpremie.be'
		},
		{
			name: 'Mijn VerbouwPremie – elektriciteit',
			categoryId: categoryId('Elektriciteit'),
			expectedCents: 0,
			notes: 'Enkel bij vernieuwen van de volledige installatie, met keuringsverslag'
		}
	]);

	// Choices that usually block the order of works, with a deadline before the phase that needs them.
	await db.insert(tables.decisions).values(
		OPEN_DECISIONS.map((decision) => ({
			title: decision.title,
			body: decision.body,
			categoryId: categoryId(decision.category),
			deadline: week(decision.week),
			createdBy: ownerId
		}))
	);

	return true;
}

async function seedDemoBudget(): Promise<void> {
	const categories = await db.select().from(tables.categories);
	const categoryId = (name: string) => categories.find((category) => category.name === name)?.id ?? null;
	const contact = await db
		.insert(tables.contacts)
		.values({ name: 'Jan Dakwerken', company: 'Dakwerken Jan BV', trade: 'Dakwerker', phone: '+32 470 12 34 56' })
		.returning()
		.get();

	await db.insert(tables.budgetLines).values([
		{ label: 'Dak + isolatie', categoryId: categoryId('Dak'), plannedCents: 3_500_000 },
		{ label: 'Elektriciteit volledig', categoryId: categoryId('Elektriciteit'), plannedCents: 1_200_000 },
		{ label: 'Badkamer', categoryId: categoryId('Badkamer'), plannedCents: 1_500_000 },
		{ label: 'Keuken', categoryId: categoryId('Keuken'), plannedCents: 1_800_000 },
		{ label: 'Schilderwerk', categoryId: categoryId('Schilderwerk'), plannedCents: 400_000 }
	]);
	const quote = await db
		.insert(tables.quotes)
		.values({
			title: 'Dakwerken incl. isolatie',
			contactId: contact.id,
			categoryId: categoryId('Dak'),
			amountExclCents: 3_200_000,
			vatRate: 6,
			status: 'approved',
			receivedOn: addDays(todayIso(), -10)
		})
		.returning()
		.get();
	await db.insert(tables.expenses).values({
		description: 'Voorschot dakwerken (30%)',
		contactId: contact.id,
		quoteId: quote.id,
		categoryId: categoryId('Dak'),
		amountExclCents: 960_000,
		vatRate: 6,
		amountInclCents: 1_017_600,
		invoiceDate: addDays(todayIso(), -5),
		dueDate: addDays(todayIso(), 25)
	});
}

export default defineEventHandler(async (event) => {
	const isDev = process.env.NODE_ENV === 'development';
	const seedKey = getHeader(event, 'x-seed-key');
	if (!isDev && (!process.env.SEED_KEY || seedKey !== process.env.SEED_KEY)) {
		throw createError({ statusCode: 403, message: 'Seeding is not allowed' });
	}

	const owner = await seedOwner();
	const structure = await seedStructure(owner.id);
	const demo = isDev && getQuery(event).demo !== undefined && structure;
	if (demo) {
		await seedDemoBudget();
	}

	return {
		success: true,
		owner: owner.created ? `Eigenaar aangemaakt: ${OWNER_EMAIL}` : `Eigenaar bestond al: ${OWNER_EMAIL}`,
		structure: structure ? 'Werkposten, ruimtes, fases en starttaken aangemaakt' : 'Structuur bestond al',
		demo
	};
});

import { createId } from '@paralleldrive/cuid2';
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import {
	ATTACHMENT_ENTITIES,
	CATEGORY_COLORS,
	DECISION_STATUSES,
	MATERIAL_STATUSES,
	MATERIAL_UNITS,
	PAYMENT_METHODS,
	PLAN_MARKER_KINDS,
	QUOTE_STATUSES,
	SUBSIDY_STATUSES,
	TASK_PRIORITIES,
	TASK_STATUSES,
	USER_ROLES
} from '../../shared/utils/constants';

// Conventions: money columns are integer cents, calendar dates are 'YYYY-MM-DD' text (no timezone shifts),
// moments are integer timestamps.
const id = () =>
	text('id')
		.primaryKey()
		.$defaultFn(() => createId());
const createdAt = () =>
	integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date());
const updatedAt = () =>
	integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date());
const sortOrder = () => integer('sort_order').notNull().default(0);

export const users = sqliteTable('users', {
	id: id(),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	name: text('name').notNull(),
	role: text('role', { enum: USER_ROLES }).notNull().default('member'),
	// Externals (contractors, family) only see the tasks assigned to this contact.
	contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
	passwordChangedAt: integer('password_changed_at', { mode: 'timestamp' }),
	createdAt: createdAt()
});

/** Single row with project-wide settings. */
export const project = sqliteTable('project', {
	id: text('id').primaryKey().default('main'),
	name: text('name').notNull().default('Verbouwing'),
	address: text('address'),
	startDate: text('start_date'),
	targetEndDate: text('target_end_date'),
	contingencyPercent: integer('contingency_percent').notNull().default(10),
	updatedAt: updatedAt()
});

export const rooms = sqliteTable('rooms', {
	id: id(),
	name: text('name').notNull(),
	floor: text('floor'),
	notes: text('notes'),
	sortOrder: sortOrder(),
	createdAt: createdAt()
});

export const categories = sqliteTable('categories', {
	id: id(),
	name: text('name').notNull(),
	color: text('color', { enum: CATEGORY_COLORS }).notNull().default('stone'),
	icon: text('icon').notNull().default('i-lucide-hammer'),
	sortOrder: sortOrder(),
	createdAt: createdAt()
});

export const phases = sqliteTable('phases', {
	id: id(),
	name: text('name').notNull(),
	startDate: text('start_date'),
	endDate: text('end_date'),
	isMilestone: integer('is_milestone', { mode: 'boolean' }).notNull().default(false),
	sortOrder: sortOrder(),
	createdAt: createdAt()
});

export const contacts = sqliteTable('contacts', {
	id: id(),
	name: text('name').notNull(),
	company: text('company'),
	trade: text('trade'),
	email: text('email'),
	phone: text('phone'),
	vatNumber: text('vat_number'),
	notes: text('notes'),
	createdAt: createdAt()
});

export const tasks = sqliteTable(
	'tasks',
	{
		id: id(),
		title: text('title').notNull(),
		description: text('description'),
		status: text('status', { enum: TASK_STATUSES }).notNull().default('todo'),
		priority: text('priority', { enum: TASK_PRIORITIES }).notNull().default('normal'),
		roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
		categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
		phaseId: text('phase_id').references(() => phases.id, { onDelete: 'set null' }),
		assigneeUserId: text('assignee_user_id').references(() => users.id, { onDelete: 'set null' }),
		assigneeContactId: text('assignee_contact_id').references(() => contacts.id, { onDelete: 'set null' }),
		startDate: text('start_date'),
		dueDate: text('due_date'),
		doneAt: integer('done_at', { mode: 'timestamp' }),
		sortOrder: sortOrder(),
		createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [
		index('tasks_status_idx').on(table.status),
		index('tasks_assignee_contact_idx').on(table.assigneeContactId),
		index('tasks_phase_idx').on(table.phaseId)
	]
);

export const taskDependencies = sqliteTable(
	'task_dependencies',
	{
		taskId: text('task_id')
			.notNull()
			.references(() => tasks.id, { onDelete: 'cascade' }),
		dependsOnTaskId: text('depends_on_task_id')
			.notNull()
			.references(() => tasks.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.taskId, table.dependsOnTaskId] })]
);

export const taskComments = sqliteTable(
	'task_comments',
	{
		id: id(),
		taskId: text('task_id')
			.notNull()
			.references(() => tasks.id, { onDelete: 'cascade' }),
		userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
		body: text('body').notNull(),
		createdAt: createdAt()
	},
	(table) => [index('task_comments_task_idx').on(table.taskId)]
);

export const budgetLines = sqliteTable('budget_lines', {
	id: id(),
	categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
	roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
	label: text('label').notNull(),
	plannedCents: integer('planned_cents').notNull().default(0),
	notes: text('notes'),
	createdAt: createdAt()
});

export const quotes = sqliteTable('quotes', {
	id: id(),
	title: text('title').notNull(),
	contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
	categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
	amountExclCents: integer('amount_excl_cents').notNull().default(0),
	vatRate: integer('vat_rate').notNull().default(6),
	status: text('status', { enum: QUOTE_STATUSES }).notNull().default('requested'),
	receivedOn: text('received_on'),
	validUntil: text('valid_until'),
	notes: text('notes'),
	createdAt: createdAt(),
	updatedAt: updatedAt()
});

export const expenses = sqliteTable(
	'expenses',
	{
		id: id(),
		description: text('description').notNull(),
		contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
		quoteId: text('quote_id').references(() => quotes.id, { onDelete: 'set null' }),
		categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
		roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
		amountExclCents: integer('amount_excl_cents').notNull().default(0),
		vatRate: integer('vat_rate').notNull().default(6),
		// Stored rather than derived: invoices round per line, so the total on paper is what counts.
		amountInclCents: integer('amount_incl_cents').notNull().default(0),
		invoiceNumber: text('invoice_number'),
		invoiceDate: text('invoice_date'),
		dueDate: text('due_date'),
		paidOn: text('paid_on'),
		paymentMethod: text('payment_method', { enum: PAYMENT_METHODS }),
		notes: text('notes'),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [index('expenses_category_idx').on(table.categoryId)]
);

export const subsidies = sqliteTable('subsidies', {
	id: id(),
	name: text('name').notNull(),
	categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
	expectedCents: integer('expected_cents').notNull().default(0),
	receivedCents: integer('received_cents').notNull().default(0),
	status: text('status', { enum: SUBSIDY_STATUSES }).notNull().default('planned'),
	deadline: text('deadline'),
	notes: text('notes'),
	createdAt: createdAt()
});

/** Single row: the Google account whose Drive holds the project files. */
export const driveConnection = sqliteTable('drive_connection', {
	id: text('id').primaryKey().default('main'),
	googleEmail: text('google_email').notNull(),
	encryptedRefreshToken: text('encrypted_refresh_token').notNull(),
	accessToken: text('access_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	rootFolderId: text('root_folder_id'),
	rootFolderName: text('root_folder_name'),
	connectedBy: text('connected_by').references(() => users.id, { onDelete: 'set null' }),
	createdAt: createdAt()
});

export const attachments = sqliteTable(
	'attachments',
	{
		id: id(),
		entityType: text('entity_type', { enum: ATTACHMENT_ENTITIES }).notNull(),
		entityId: text('entity_id').notNull(),
		driveFileId: text('drive_file_id').notNull(),
		name: text('name').notNull(),
		mimeType: text('mime_type').notNull(),
		size: integer('size'),
		webViewLink: text('web_view_link'),
		createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: createdAt()
	},
	(table) => [
		index('attachments_entity_idx').on(table.entityType, table.entityId),
		uniqueIndex('attachments_entity_file_uq').on(table.entityType, table.entityId, table.driveFileId),
		index('attachments_file_idx').on(table.driveFileId)
	]
);

export const invites = sqliteTable('invites', {
	id: id(),
	email: text('email').notNull(),
	name: text('name'),
	role: text('role', { enum: USER_ROLES }).notNull().default('external'),
	contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
	tokenHash: text('token_hash').notNull().unique(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	usedBy: text('used_by').references(() => users.id, { onDelete: 'set null' }),
	usedAt: integer('used_at', { mode: 'timestamp' }),
	createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
	createdAt: createdAt()
});

/** One floor of the house, drawn over a plan image from Drive (or a blank grid). */
export const floorPlans = sqliteTable('floor_plans', {
	id: id(),
	name: text('name').notNull(),
	backgroundFileId: text('background_file_id'),
	backgroundName: text('background_name'),
	// Width / height of the background, so the plan keeps its shape at any screen size.
	aspectRatio: real('aspect_ratio').notNull().default(1.4142),
	sortOrder: sortOrder(),
	createdAt: createdAt()
});

/**
 * A zone (polygon, usually a room) or a pin (a spot with a note) on a floor plan. Points are fractions of the
 * plan's width and height (0..1), so markers stay put when the plan is shown larger or smaller.
 */
export const planMarkers = sqliteTable(
	'plan_markers',
	{
		id: id(),
		floorPlanId: text('floor_plan_id')
			.notNull()
			.references(() => floorPlans.id, { onDelete: 'cascade' }),
		kind: text('kind', { enum: PLAN_MARKER_KINDS }).notNull(),
		label: text('label').notNull().default(''),
		note: text('note'),
		color: text('color', { enum: CATEGORY_COLORS }).notNull().default('amber'),
		points: text('points', { mode: 'json' }).$type<[number, number][]>().notNull(),
		roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
		taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
		createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [index('plan_markers_floor_idx').on(table.floorPlanId)]
);

/**
 * A choice made (or still to make) during the works: "Tiles: model X, 60×60, ordered 12 Nov". Kept so the
 * reasoning survives, and so things can be re-ordered later.
 */
export const decisions = sqliteTable(
	'decisions',
	{
		id: id(),
		title: text('title').notNull(),
		/** What was chosen, the options considered and why. */
		body: text('body'),
		status: text('status', { enum: DECISION_STATUSES }).notNull().default('open'),
		/** Open decisions: decide before this date. */
		deadline: text('deadline'),
		decidedOn: text('decided_on'),
		decidedBy: text('decided_by').references(() => users.id, { onDelete: 'set null' }),
		roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
		categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
		taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
		contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
		/** Product, model, colour code… whatever is needed to order it again. */
		reference: text('reference'),
		createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [index('decisions_status_idx').on(table.status), index('decisions_room_idx').on(table.roomId)]
);

/** Something to buy for the works: the shopping list, from "needed" to "delivered", and later an invoice. */
export const materials = sqliteTable(
	'materials',
	{
		id: id(),
		name: text('name').notNull(),
		quantity: real('quantity').notNull().default(1),
		unit: text('unit', { enum: MATERIAL_UNITS }).notNull().default('st'),
		/** Incl. VAT, per unit; the line total is quantity × unit price. */
		unitPriceCents: integer('unit_price_cents'),
		status: text('status', { enum: MATERIAL_STATUSES }).notNull().default('needed'),
		/** When it has to be on site; falls back to the linked task's start date. */
		neededBy: text('needed_by'),
		orderedOn: text('ordered_on'),
		deliveredOn: text('delivered_on'),
		roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
		categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
		contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
		taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
		decisionId: text('decision_id').references(() => decisions.id, { onDelete: 'set null' }),
		/** Set once the purchase is booked as an invoice, so the budget doesn't count it twice. */
		expenseId: text('expense_id').references(() => expenses.id, { onDelete: 'set null' }),
		url: text('url'),
		notes: text('notes'),
		sortOrder: sortOrder(),
		createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [index('materials_status_idx').on(table.status), index('materials_room_idx').on(table.roomId)]
);

import type { CategoryBudget, BudgetTotals } from '../utils/budget';
import type {
	AttachmentEntity,
	CategoryColor,
	PaymentMethod,
	PlanMarkerKind,
	QuoteStatus,
	SubsidyStatus,
	TaskPriority,
	TaskStatus,
	UserRole
} from '../utils/constants';

/** JSON shapes returned by the API. Timestamps arrive as ISO strings, calendar dates as 'YYYY-MM-DD'. */

export interface UserView {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	contactId: string | null;
	createdAt: string;
}

export interface PersonRef {
	id: string;
	name: string;
}

export interface ProjectView {
	name: string;
	address: string | null;
	startDate: string | null;
	targetEndDate: string | null;
	contingencyPercent: number;
}

export interface RoomView {
	id: string;
	name: string;
	floor: string | null;
	notes: string | null;
	sortOrder: number;
}

export interface CategoryView {
	id: string;
	name: string;
	color: CategoryColor;
	icon: string;
	sortOrder: number;
}

export interface PhaseView {
	id: string;
	name: string;
	startDate: string | null;
	endDate: string | null;
	isMilestone: boolean;
	sortOrder: number;
}

export interface ContactView {
	id: string;
	name: string;
	company: string | null;
	trade: string | null;
	email: string | null;
	phone: string | null;
	vatNumber: string | null;
	notes: string | null;
}

/** Everything the task screens need to show labels and pick options, in one request. */
export interface Lookups {
	rooms: RoomView[];
	categories: CategoryView[];
	phases: PhaseView[];
	contacts: ContactView[];
	users: PersonRef[];
}

export interface TaskView {
	id: string;
	title: string;
	description: string | null;
	status: TaskStatus;
	priority: TaskPriority;
	roomId: string | null;
	categoryId: string | null;
	phaseId: string | null;
	assigneeUserId: string | null;
	assigneeContactId: string | null;
	startDate: string | null;
	dueDate: string | null;
	doneAt: string | null;
	sortOrder: number;
	dependsOn: string[];
	commentCount: number;
	attachmentCount: number;
	createdAt: string;
}

export interface CommentView {
	id: string;
	body: string;
	author: PersonRef | null;
	createdAt: string;
}

export interface TaskDetail extends TaskView {
	comments: CommentView[];
}

export interface BudgetLineView {
	id: string;
	label: string;
	categoryId: string | null;
	roomId: string | null;
	plannedCents: number;
	notes: string | null;
}

export interface QuoteView {
	id: string;
	title: string;
	contactId: string | null;
	categoryId: string | null;
	amountExclCents: number;
	vatRate: number;
	amountInclCents: number;
	status: QuoteStatus;
	receivedOn: string | null;
	validUntil: string | null;
	notes: string | null;
	attachmentCount: number;
}

export interface ExpenseView {
	id: string;
	description: string;
	contactId: string | null;
	quoteId: string | null;
	categoryId: string | null;
	roomId: string | null;
	amountExclCents: number;
	vatRate: number;
	amountInclCents: number;
	invoiceNumber: string | null;
	invoiceDate: string | null;
	dueDate: string | null;
	paidOn: string | null;
	paymentMethod: PaymentMethod | null;
	notes: string | null;
	attachmentCount: number;
}

export interface SubsidyView {
	id: string;
	name: string;
	categoryId: string | null;
	expectedCents: number;
	receivedCents: number;
	status: SubsidyStatus;
	deadline: string | null;
	notes: string | null;
}

export interface BudgetOverview {
	lines: BudgetLineView[];
	quotes: QuoteView[];
	expenses: ExpenseView[];
	subsidies: SubsidyView[];
	categories: CategoryBudget[];
	totals: BudgetTotals;
	contingencyPercent: number;
}

export interface DashboardView {
	project: ProjectView;
	taskCounts: Record<TaskStatus, number>;
	thisWeek: TaskView[];
	overdue: TaskView[];
	blocked: TaskView[];
	/** Null for externals, who don't see the budget. */
	budget: { totals: BudgetTotals; categories: CategoryBudget[]; unpaidCount: number; unpaidCents: number } | null;
	recentFiles: AttachmentView[];
}

export interface DriveStatus {
	connected: boolean;
	configured: boolean;
	googleEmail: string | null;
	rootFolderId: string | null;
	rootFolderName: string | null;
}

export interface DriveFile {
	id: string;
	name: string;
	mimeType: string;
	isFolder: boolean;
	size: number | null;
	modifiedTime: string | null;
	webViewLink: string | null;
	hasThumbnail: boolean;
}

export interface DriveListing {
	folder: { id: string; name: string };
	breadcrumbs: { id: string; name: string }[];
	files: DriveFile[];
}

export interface AttachmentView {
	id: string;
	entityType: AttachmentEntity;
	entityId: string;
	driveFileId: string;
	name: string;
	mimeType: string;
	size: number | null;
	webViewLink: string | null;
	createdAt: string;
}

export interface InviteView {
	id: string;
	email: string;
	name: string | null;
	role: UserRole;
	contactId: string | null;
	url: string | null;
	expiresAt: string;
	usedAt: string | null;
}

export interface InviteLookup {
	email: string;
	name: string | null;
	inviterName: string | null;
}

export interface PlanMarkerView {
	id: string;
	floorPlanId: string;
	kind: PlanMarkerKind;
	label: string;
	note: string | null;
	color: CategoryColor;
	/** Fractions (0..1) of the plan's width and height. */
	points: [number, number][];
	roomId: string | null;
	taskId: string | null;
}

export interface FloorPlanView {
	id: string;
	name: string;
	backgroundFileId: string | null;
	backgroundName: string | null;
	aspectRatio: number;
	sortOrder: number;
	markers: PlanMarkerView[];
}

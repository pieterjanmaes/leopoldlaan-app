export { sql, eq, and, or, ne, inArray, isNull, isNotNull, desc, asc } from 'drizzle-orm';

export * as tables from '../db/schema';

type Schema = typeof import('../db/schema');

export type User = Schema['users']['$inferSelect'];
export type Project = Schema['project']['$inferSelect'];
export type Room = Schema['rooms']['$inferSelect'];
export type Category = Schema['categories']['$inferSelect'];
export type Phase = Schema['phases']['$inferSelect'];
export type Contact = Schema['contacts']['$inferSelect'];
export type Task = Schema['tasks']['$inferSelect'];
export type TaskComment = Schema['taskComments']['$inferSelect'];
export type BudgetLine = Schema['budgetLines']['$inferSelect'];
export type Quote = Schema['quotes']['$inferSelect'];
export type Expense = Schema['expenses']['$inferSelect'];
export type Subsidy = Schema['subsidies']['$inferSelect'];
export type DriveConnection = Schema['driveConnection']['$inferSelect'];
export type Attachment = Schema['attachments']['$inferSelect'];
export type Invite = Schema['invites']['$inferSelect'];
export type FloorPlan = Schema['floorPlans']['$inferSelect'];
export type PlanMarker = Schema['planMarkers']['$inferSelect'];

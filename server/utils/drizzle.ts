export { sql, eq, and, or } from 'drizzle-orm';

export * as tables from '../db/schema';

export type FormSubmission = typeof import('../db/schema').formSubmissions.$inferSelect;
export type User = typeof import('../db/schema').users.$inferSelect;

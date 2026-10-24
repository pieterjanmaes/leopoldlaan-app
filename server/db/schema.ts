import { createId } from '@paralleldrive/cuid2';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	name: text('name'),
	role: text('role', { enum: ['admin', 'superadmin'] })
		.notNull()
		.default('admin'),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const formSubmissions = sqliteTable('form_submissions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	email: text('email').notNull(),
	phone: text('phone'),
	timeSlot: text('time_slot'),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

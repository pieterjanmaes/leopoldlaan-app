import type { H3Event } from 'h3';
import { db } from 'hub:db';

import type { User as SessionUser } from '#auth-utils';

import { isInternal, isOwner } from '../../shared/utils/permissions';
import { eq, tables, type User } from './drizzle';

declare module 'h3' {
	interface H3EventContext {
		user?: SessionUser;
	}
}

const sessionColumns = {
	id: tables.users.id,
	email: tables.users.email,
	name: tables.users.name,
	role: tables.users.role,
	contactId: tables.users.contactId,
	passwordChangedAt: tables.users.passwordChangedAt
};

export function toSessionUser(user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'contactId'>): SessionUser {
	return { id: user.id, email: user.email, name: user.name, role: user.role, contactId: user.contactId };
}

/**
 * Re-validates a cookie session against the database: the user must still exist and the session must be newer
 * than their last password change. Returns the current fields, so role changes reach the session.
 */
export async function loadSessionUser(userId: string, loggedInAt: number | undefined): Promise<SessionUser | null> {
	const user = await db.select(sessionColumns).from(tables.users).where(eq(tables.users.id, userId)).get();
	if (!user) {
		return null;
	}
	if (user.passwordChangedAt && (loggedInAt === undefined || loggedInAt < user.passwordChangedAt.getTime())) {
		return null;
	}

	return toSessionUser(user);
}

export async function startUserSession(event: H3Event, user: SessionUser): Promise<void> {
	await replaceUserSession(event, { user, loggedInAt: Date.now() });
}

export async function requireUser(event: H3Event): Promise<SessionUser> {
	if (event.context.user) {
		return event.context.user;
	}

	const session = await requireUserSession(event);
	const user = await loadSessionUser(session.user.id, session.loggedInAt);
	if (!user) {
		await clearUserSession(event);
		throw createError({ statusCode: 401, message: 'Je sessie is verlopen, meld je opnieuw aan' });
	}

	event.context.user = user;

	return user;
}

/** Owners and housemates: everything except user management. */
export async function requireInternal(event: H3Event): Promise<SessionUser> {
	const user = await requireUser(event);
	if (!isInternal(user)) {
		throw createError({ statusCode: 403, message: 'Hier heb je geen toegang toe' });
	}

	return user;
}

export async function requireOwner(event: H3Event): Promise<SessionUser> {
	const user = await requireUser(event);
	if (!isOwner(user)) {
		throw createError({ statusCode: 403, message: 'Alleen de eigenaar kan dit doen' });
	}

	return user;
}

let dummyHash: string | undefined;

export async function findUserByCredentials(email: string, password: string): Promise<SessionUser> {
	const user = await db
		.select({ ...sessionColumns, password: tables.users.password })
		.from(tables.users)
		.where(eq(tables.users.email, email.toLowerCase()))
		.get();

	// Always verify a hash, so an unknown e-mail takes as long as a wrong password and gets the same message.
	dummyHash ??= await hashPassword(generateSecret());
	const valid = await verifyPassword(user?.password ?? dummyHash, password);
	if (!user || !valid) {
		throw createError({ statusCode: 401, message: 'E-mailadres of wachtwoord is onjuist' });
	}

	return toSessionUser(user);
}

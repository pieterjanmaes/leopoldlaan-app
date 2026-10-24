import type { H3Event } from 'h3';
import { db } from 'hub:db';

import { DAY_MS, INVITE_TTL_DAYS } from '../../shared/utils/constants';
import { and, eq, isNull, tables, type Invite } from './drizzle';

export function toInviteView(invite: Invite, url: string | null = null): InviteView {
	return {
		id: invite.id,
		email: invite.email,
		name: invite.name,
		role: invite.role,
		contactId: invite.contactId,
		url,
		expiresAt: invite.expiresAt.toISOString(),
		usedAt: invite.usedAt ? invite.usedAt.toISOString() : null
	};
}

export function inviteUrl(event: H3Event, token: string): string {
	return `${getRequestURL(event).origin}/registreer?invite=${encodeURIComponent(token)}`;
}

export async function createInvite(
	event: H3Event,
	createdBy: string,
	input: { email: string; name?: string | null; role: UserRole; contactId?: string | null }
): Promise<InviteView> {
	const token = generateSecret(24);
	const invite = await db
		.insert(tables.invites)
		.values({
			email: input.email.toLowerCase(),
			name: input.name ?? null,
			role: input.role,
			contactId: input.role === 'external' ? (input.contactId ?? null) : null,
			tokenHash: await hashSecret(token),
			expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * DAY_MS),
			createdBy
		})
		.returning()
		.get();

	// The plain token only exists in this response; afterwards the link cannot be shown again.
	return toInviteView(invite, inviteUrl(event, token));
}

export async function findValidInvite(token: string): Promise<Invite> {
	const invite = await db
		.select()
		.from(tables.invites)
		.where(eq(tables.invites.tokenHash, await hashSecret(token)))
		.get();
	if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
		throw createError({ statusCode: 410, message: 'Deze uitnodiging is ongeldig of al gebruikt' });
	}

	return invite;
}

/** Marks an invite as used, but only if nobody else got there first. */
export function consumeInvite(inviteId: string, userId: string) {
	return db
		.update(tables.invites)
		.set({ usedBy: userId, usedAt: new Date() })
		.where(and(eq(tables.invites.id, inviteId), isNull(tables.invites.usedAt)));
}

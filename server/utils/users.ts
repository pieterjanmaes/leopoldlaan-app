import type { User } from './drizzle';

export function toUserView(user: User): UserView {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role,
		contactId: user.contactId,
		createdAt: user.createdAt.toISOString()
	};
}

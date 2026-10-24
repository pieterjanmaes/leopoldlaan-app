import type { UserRole } from './constants';

interface RoleHolder {
	role: UserRole;
}

/** Owners and housemates see everything; externals only their own tasks. */
export function isInternal(user: RoleHolder | null | undefined): boolean {
	return user?.role === 'owner' || user?.role === 'member';
}

export function isOwner(user: RoleHolder | null | undefined): boolean {
	return user?.role === 'owner';
}

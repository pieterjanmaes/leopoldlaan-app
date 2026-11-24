import { isInternal, isOwner } from '@@/shared/utils/permissions';
import { describe, expect, it } from 'vitest';

describe('roles', () => {
	it('treats owners and housemates as internal', () => {
		expect(isInternal({ role: 'owner' })).toBe(true);
		expect(isInternal({ role: 'member' })).toBe(true);
		expect(isInternal({ role: 'external' })).toBe(false);
		expect(isInternal(null)).toBe(false);
	});

	it('only owners manage users and Drive', () => {
		expect(isOwner({ role: 'owner' })).toBe(true);
		expect(isOwner({ role: 'member' })).toBe(false);
	});
});

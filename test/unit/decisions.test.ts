import { decisionStamps } from '@@/server/utils/decisions';
import { decisionSchema } from '@@/shared/schemas/decisions';
import { describe, expect, it } from 'vitest';

const user = { id: 'u1', email: 'a@b.test', name: 'An', role: 'owner' as const, contactId: null };

describe('decisionStamps', () => {
	it('stamps who and when on deciding', () => {
		const stamps = decisionStamps(user, { status: 'decided' }, { status: 'open', decidedOn: null, decidedBy: null });

		expect(stamps.decidedBy).toBe('u1');
		expect(stamps.decidedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('keeps a date that was given or already set', () => {
		expect(decisionStamps(user, { status: 'decided', decidedOn: '2026-11-03' }, null).decidedOn).toBe('2026-11-03');
		expect(
			decisionStamps(user, { status: 'decided' }, { status: 'replaced', decidedOn: '2026-10-01', decidedBy: 'u2' })
				.decidedOn
		).toBe('2026-10-01');
	});

	it('clears both when a decision is reopened', () => {
		expect(
			decisionStamps(user, { status: 'open' }, { status: 'decided', decidedOn: '2026-10-01', decidedBy: 'u2' })
		).toEqual({ decidedOn: null, decidedBy: null });
	});

	it('leaves the stamps alone when the status does not change', () => {
		expect(
			decisionStamps(user, { status: 'decided' }, { status: 'decided', decidedOn: '2026-10-01', decidedBy: 'u2' })
		).toEqual({});
		expect(decisionStamps(user, {}, { status: 'decided', decidedOn: '2026-10-01', decidedBy: 'u2' })).toEqual({});
	});
});

describe('decisionSchema', () => {
	it('needs a title and accepts empty optional fields', () => {
		expect(decisionSchema.safeParse({ title: '' }).success).toBe(false);
		expect(decisionSchema.safeParse({ title: 'Tegels', body: null, deadline: null, roomId: null }).success).toBe(true);
	});
});

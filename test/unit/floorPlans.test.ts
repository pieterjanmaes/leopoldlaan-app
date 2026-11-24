import { planMarkerSchema } from '@@/shared/schemas/floorPlans';
import { clampFraction, pixelDistance, polygonCentroid } from '@@/shared/utils/geometry';
import { describe, expect, it } from 'vitest';

describe('polygonCentroid', () => {
	it('finds the middle of a rectangle', () => {
		const [x, y] = polygonCentroid([
			[0.1, 0.1],
			[0.5, 0.1],
			[0.5, 0.3],
			[0.1, 0.3]
		]);

		expect(x).toBeCloseTo(0.3);
		expect(y).toBeCloseTo(0.2);
	});

	it('falls back to the average for a flat shape', () => {
		expect(
			polygonCentroid([
				[0, 0],
				[0.5, 0],
				[1, 0]
			])
		).toEqual([0.5, 0]);
	});
});

describe('plan coordinates', () => {
	it('keeps fractions inside the plan', () => {
		expect(clampFraction(-0.2)).toBe(0);
		expect(clampFraction(1.4)).toBe(1);
	});

	it('measures distance in screen pixels', () => {
		expect(pixelDistance([0, 0], [0.1, 0], 1000, 500)).toBe(100);
	});
});

describe('planMarkerSchema', () => {
	const base = { floorPlanId: 'f1' };

	it('accepts a pin with one point and a zone with three or more', () => {
		expect(planMarkerSchema.safeParse({ ...base, kind: 'pin', points: [[0.5, 0.5]] }).success).toBe(true);
		expect(
			planMarkerSchema.safeParse({
				...base,
				kind: 'zone',
				points: [
					[0, 0],
					[1, 0],
					[1, 1]
				]
			}).success
		).toBe(true);
	});

	it('refuses a zone that is just a line, and points outside the plan', () => {
		expect(
			planMarkerSchema.safeParse({
				...base,
				kind: 'zone',
				points: [
					[0, 0],
					[1, 1]
				]
			}).success
		).toBe(false);
		expect(planMarkerSchema.safeParse({ ...base, kind: 'pin', points: [[1.5, 0.2]] }).success).toBe(false);
	});
});

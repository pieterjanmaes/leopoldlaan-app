export type Point = [number, number];

/** Centre of mass of a polygon, for placing a zone's label; falls back to the average for degenerate shapes. */
export function polygonCentroid(points: Point[]): Point {
	let area = 0;
	let x = 0;
	let y = 0;
	for (let index = 0; index < points.length; index++) {
		const [x1, y1] = points[index] as Point;
		const [x2, y2] = points[(index + 1) % points.length] as Point;
		const cross = x1 * y2 - x2 * y1;
		area += cross;
		x += (x1 + x2) * cross;
		y += (y1 + y2) * cross;
	}
	if (Math.abs(area) < 1e-9) {
		const count = Math.max(points.length, 1);
		return [points.reduce((sum, [px]) => sum + px, 0) / count, points.reduce((sum, [, py]) => sum + py, 0) / count];
	}

	return [x / (3 * area), y / (3 * area)];
}

export function clampFraction(value: number): number {
	return Math.min(Math.max(value, 0), 1);
}

/** Distance between two points measured in pixels, given the plan's size. */
export function pixelDistance(a: Point, b: Point, width: number, height: number): number {
	return Math.hypot((a[0] - b[0]) * width, (a[1] - b[1]) * height);
}

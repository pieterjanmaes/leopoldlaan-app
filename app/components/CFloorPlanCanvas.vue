<template>
	<div
		ref="container"
		class="border-default bg-elevated/40 relative w-full touch-none overflow-hidden rounded-lg border select-none"
		:class="mode === 'select' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'"
		:style="{ height: `${height}px` }"
		tabindex="0"
		@keydown.esc="cancelDraft"
		@keydown.enter="finishZone">
		<v-stage
			v-if="width > 0"
			ref="stage"
			:config="{ width, height, scaleX: zoom, scaleY: zoom, x: offset.x, y: offset.y, draggable: mode === 'select' }"
			@click="onStageClick"
			@tap="onStageClick"
			@dblclick="finishZone"
			@dbltap="finishZone"
			@wheel="onWheel"
			@dragend="onStageDragEnd">
			<v-layer>
				<v-rect :config="{ x: 0, y: 0, width, height, fill: 'rgba(0,0,0,0)', name: 'backdrop' }" />
				<v-image
					v-if="image"
					:config="{ image, x: 0, y: 0, width, height, opacity: 0.9, listening: false }" />
				<template v-else>
					<v-line
						v-for="line in gridLines"
						:key="line.key"
						:config="{ points: line.points, stroke: gridColor, strokeWidth: 1 / zoom, listening: false }" />
				</template>
			</v-layer>

			<v-layer>
				<v-group
					v-for="zone in zones"
					:key="zone.id"
					@click="(event: KonvaPointerEvent) => onMarkerClick(event, zone.id)"
					@tap="(event: KonvaPointerEvent) => onMarkerClick(event, zone.id)">
					<v-line
						:config="{
							points: toPixels(zone.points),
							closed: true,
							fill: hexWithAlpha(zone.color, zone.id === selectedId ? 0.35 : 0.18),
							stroke: CATEGORY_HEX[zone.color],
							strokeWidth: (zone.id === selectedId ? 3 : 1.5) / zoom
						}" />
					<v-text
						v-if="zone.title"
						:config="{
							...labelPosition(zone.points),
							text: zone.title,
							fontSize: 13 / zoom,
							fontStyle: 'bold',
							fill: labelColor,
							align: 'center',
							width: 160 / zoom,
							offsetX: 80 / zoom,
							offsetY: 7 / zoom,
							listening: false
						}" />
				</v-group>

				<v-group
					v-for="pin in pins"
					:key="pin.id"
					:config="{ ...pinPosition(pin), draggable: mode === 'select' }"
					@click="(event: KonvaPointerEvent) => onMarkerClick(event, pin.id)"
					@tap="(event: KonvaPointerEvent) => onMarkerClick(event, pin.id)"
					@dragend="(event: KonvaDragEvent) => onPinDragEnd(event, pin.id)">
					<v-circle
						:config="{
							radius: (pin.id === selectedId ? 11 : 9) / zoom,
							fill: CATEGORY_HEX[pin.color],
							stroke: '#ffffff',
							strokeWidth: 2 / zoom,
							shadowBlur: 4,
							shadowOpacity: 0.3
						}" />
					<v-text
						:config="{
							text: String(pin.number),
							fontSize: 10 / zoom,
							fontStyle: 'bold',
							fill: '#ffffff',
							width: 20 / zoom,
							height: 20 / zoom,
							offsetX: 10 / zoom,
							offsetY: 10 / zoom,
							align: 'center',
							verticalAlign: 'middle',
							listening: false
						}" />
				</v-group>

				<template v-if="draft.length">
					<v-line
						:config="{
							points: toPixels(draft),
							stroke: CATEGORY_HEX[draftColor],
							strokeWidth: 2 / zoom,
							dash: [6 / zoom, 4 / zoom],
							listening: false
						}" />
					<v-circle
						v-for="(point, index) in draft"
						:key="index"
						:config="{
							x: point[0] * width,
							y: point[1] * height,
							radius: (index === 0 ? 7 : 4) / zoom,
							fill: index === 0 ? CATEGORY_HEX[draftColor] : '#ffffff',
							stroke: CATEGORY_HEX[draftColor],
							strokeWidth: 2 / zoom,
							listening: false
						}" />
				</template>
			</v-layer>
		</v-stage>

		<div class="absolute right-2 bottom-2 flex flex-col gap-1">
			<UButton
				icon="i-lucide-plus"
				color="neutral"
				variant="outline"
				size="xs"
				class="bg-default"
				aria-label="Inzoomen"
				@click="zoomBy(1.25)" />
			<UButton
				icon="i-lucide-minus"
				color="neutral"
				variant="outline"
				size="xs"
				class="bg-default"
				aria-label="Uitzoomen"
				@click="zoomBy(0.8)" />
			<UButton
				icon="i-lucide-maximize"
				color="neutral"
				variant="outline"
				size="xs"
				class="bg-default"
				aria-label="Passend maken"
				@click="resetView" />
		</div>

		<p
			v-if="mode === 'zone'"
			class="bg-default/90 text-muted absolute top-2 left-2 rounded-md px-2 py-1 text-xs shadow-xs">
			{{
				draft.length < 3
					? 'Klik de hoeken van de zone aan.'
					: 'Klik op het eerste punt, dubbelklik of druk Enter om af te sluiten. Esc annuleert.'
			}}
		</p>
		<p
			v-else-if="mode === 'pin'"
			class="bg-default/90 text-muted absolute top-2 left-2 rounded-md px-2 py-1 text-xs shadow-xs">
			Klik waar de pin moet komen.
		</p>
	</div>
</template>

<script setup lang="ts">
	import type Konva from 'konva';
	import { useImage } from 'vue-konva';

	import type { Point } from '#shared/utils/geometry';

	type KonvaPointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>;
	type KonvaDragEvent = Konva.KonvaEventObject<DragEvent>;
	export type PlanMode = 'select' | 'zone' | 'pin';

	const MIN_ZOOM = 0.5;
	const MAX_ZOOM = 6;
	const GRID_STEPS = 20;
	// Clicking within this many pixels of the first corner closes the zone.
	const CLOSE_DISTANCE_PX = 12;

	const props = defineProps<{
		plan: FloorPlanView;
		mode: PlanMode;
		selectedId: string | null;
		/** Colour of the zone being drawn. */
		draftColor: CategoryColor;
		/** Zone label fallback: the linked room's name. */
		roomNames: Map<string, string>;
	}>();

	const emit = defineEmits<{
		select: [id: string | null];
		create: [marker: { kind: PlanMarkerKind; points: Point[] }];
		move: [marker: { id: string; points: Point[] }];
		aspect: [ratio: number];
	}>();

	const container = useTemplateRef<HTMLDivElement>('container');
	const stage = useTemplateRef<{ getNode: () => Konva.Stage }>('stage');
	const { width } = useElementSize(container);
	const colorMode = useColorMode();

	const height = computed(() => Math.round(width.value / (props.plan.aspectRatio || 1.4142)));
	const zoom = ref(1);
	const offset = ref({ x: 0, y: 0 });
	const draft = ref<Point[]>([]);

	const imageUrl = computed(() => (props.plan.backgroundFileId ? driveContentUrl(props.plan.backgroundFileId) : ''));
	const [image] = useImage(imageUrl);

	// Keep the stored ratio in line with the actual image, so pins don't drift when the plan is replaced.
	watch(image, (loaded) => {
		if (!loaded?.naturalWidth || !loaded.naturalHeight) return;
		const ratio = loaded.naturalWidth / loaded.naturalHeight;
		if (Math.abs(ratio - props.plan.aspectRatio) > 0.01) emit('aspect', ratio);
	});

	watch(
		() => props.plan.id,
		() => {
			draft.value = [];
			resetView();
		}
	);
	watch(
		() => props.mode,
		() => {
			draft.value = [];
		}
	);

	const gridColor = computed(() => (colorMode.value === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'));
	const labelColor = computed(() => (colorMode.value === 'dark' ? '#fafaf9' : '#1c1917'));

	const gridLines = computed(() => {
		const lines: { key: string; points: number[] }[] = [];
		for (let step = 1; step < GRID_STEPS; step++) {
			const x = (width.value / GRID_STEPS) * step;
			const y = (height.value / GRID_STEPS) * step;
			lines.push({ key: `v${step}`, points: [x, 0, x, height.value] });
			lines.push({ key: `h${step}`, points: [0, y, width.value, y] });
		}

		return lines;
	});

	const zones = computed(() =>
		props.plan.markers
			.filter((marker) => marker.kind === 'zone')
			.map((marker) => ({
				...marker,
				title: marker.label || (marker.roomId ? (props.roomNames.get(marker.roomId) ?? '') : '')
			}))
	);
	// Pins are numbered in creation order, matching the list next to the plan.
	const pins = computed(() =>
		props.plan.markers
			.filter((marker) => marker.kind === 'pin')
			.map((marker, index) => ({ ...marker, number: index + 1 }))
	);

	function toPixels(points: Point[]): number[] {
		return points.flatMap(([x, y]) => [x * width.value, y * height.value]);
	}

	function hexWithAlpha(color: CategoryColor, alpha: number): string {
		return `${CATEGORY_HEX[color]}${Math.round(alpha * 255)
			.toString(16)
			.padStart(2, '0')}`;
	}

	function labelPosition(points: Point[]) {
		const [x, y] = polygonCentroid(points);

		return { x: x * width.value, y: y * height.value };
	}

	function pinPosition(pin: PlanMarkerView) {
		const [x, y] = pin.points[0] ?? [0.5, 0.5];

		return { x: x * width.value, y: y * height.value };
	}

	/** Pointer position as fractions of the plan, undoing pan and zoom. */
	function pointerFraction(): Point | null {
		const position = stage.value?.getNode().getRelativePointerPosition();
		if (!position || !width.value || !height.value) return null;

		return [clampFraction(position.x / width.value), clampFraction(position.y / height.value)];
	}

	function onStageClick(event: KonvaPointerEvent) {
		if (props.mode === 'select') {
			// Clicking empty space deselects; markers stop the event themselves.
			emit('select', null);
			return;
		}

		const point = pointerFraction();
		if (!point) return;
		if (props.mode === 'pin') {
			emit('create', { kind: 'pin', points: [point] });
			return;
		}

		const first = draft.value[0];
		if (
			first &&
			draft.value.length >= 3 &&
			pixelDistance(first, point, width.value * zoom.value, height.value * zoom.value) < CLOSE_DISTANCE_PX
		) {
			finishZone();
			return;
		}
		// A double click fires two clicks first; skip the duplicate point it would add.
		const last = draft.value[draft.value.length - 1];
		if (last && pixelDistance(last, point, width.value, height.value) < 2) return;
		draft.value = [...draft.value, point];
		event.cancelBubble = true;
	}

	function finishZone() {
		if (props.mode !== 'zone' || draft.value.length < 3) return;
		emit('create', { kind: 'zone', points: draft.value });
		draft.value = [];
	}

	function cancelDraft() {
		draft.value = [];
	}

	function onMarkerClick(event: KonvaPointerEvent, id: string) {
		if (props.mode !== 'select') return;
		event.cancelBubble = true;
		emit('select', id);
	}

	function onPinDragEnd(event: KonvaDragEvent, id: string) {
		event.cancelBubble = true;
		const node = event.target;
		emit('move', {
			id,
			points: [[clampFraction(node.x() / width.value), clampFraction(node.y() / height.value)]]
		});
	}

	function onStageDragEnd(event: KonvaDragEvent) {
		// Only the stage itself pans; pin drags are handled above.
		if (event.target !== stage.value?.getNode()) return;
		offset.value = { x: event.target.x(), y: event.target.y() };
	}

	function setZoom(next: number, around: { x: number; y: number }) {
		const clamped = Math.min(Math.max(next, MIN_ZOOM), MAX_ZOOM);
		const pointTo = { x: (around.x - offset.value.x) / zoom.value, y: (around.y - offset.value.y) / zoom.value };
		zoom.value = clamped;
		offset.value = { x: around.x - pointTo.x * clamped, y: around.y - pointTo.y * clamped };
	}

	function onWheel(event: Konva.KonvaEventObject<WheelEvent>) {
		event.evt.preventDefault();
		const pointer = stage.value?.getNode().getPointerPosition();
		if (!pointer) return;
		setZoom(zoom.value * (event.evt.deltaY > 0 ? 0.9 : 1.1), pointer);
	}

	function zoomBy(factor: number) {
		setZoom(zoom.value * factor, { x: width.value / 2, y: height.value / 2 });
	}

	function resetView() {
		zoom.value = 1;
		offset.value = { x: 0, y: 0 };
	}
</script>

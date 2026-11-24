<template>
	<UModal :title="plan ? 'Verdieping bewerken' : 'Nieuwe verdieping'">
		<template #body>
			<UForm
				:schema="floorPlanSchema"
				:state="state"
				class="space-y-4"
				@submit="save">
				<UFormField
					label="Naam"
					name="name"
					required>
					<UInput
						v-model="state.name"
						placeholder="Bv. gelijkvloers"
						class="w-full"
						autofocus />
				</UFormField>

				<UFormField
					label="Plan"
					description="Een afbeelding (PNG, JPG of SVG) uit de projectmap, bv. een export uit openPlan3D of een foto van het plan van de architect. Zonder plan teken je op een raster.">
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-muted min-w-0 flex-1 truncate text-sm">
							{{ backgroundName ?? 'Geen plan, enkel een raster' }}
						</span>
						<UButton
							icon="i-lucide-hard-drive"
							label="Kies uit Drive"
							color="neutral"
							variant="outline"
							size="sm"
							@click="pick" />
						<UButton
							icon="i-lucide-upload"
							label="Uploaden"
							color="neutral"
							variant="outline"
							size="sm"
							:loading="uploading"
							@click="fileInput?.click()" />
						<UButton
							v-if="state.backgroundFileId"
							icon="i-lucide-x"
							color="neutral"
							variant="ghost"
							size="sm"
							aria-label="Plan weghalen"
							@click="clearBackground" />
						<input
							ref="fileInput"
							type="file"
							accept="image/*"
							class="hidden"
							@change="onFile" />
					</div>
				</UFormField>

				<CModalActions
					:loading="pending"
					@cancel="emit('close', null)" />
			</UForm>
		</template>
	</UModal>
</template>

<script setup lang="ts">
	import { CDrivePickerModal } from '#components';
	import { floorPlanSchema } from '#shared/schemas/floorPlans';

	const props = defineProps<{
		plan?: FloorPlanView | null;
		sortOrder?: number;
	}>();

	const emit = defineEmits<{
		close: [plan: FloorPlanView | null];
	}>();

	useZodLocale();

	const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
	const state = reactive({
		name: props.plan?.name ?? '',
		backgroundFileId: props.plan?.backgroundFileId ?? null,
		sortOrder: props.plan?.sortOrder ?? props.sortOrder ?? 0
	});
	const backgroundName = ref(props.plan?.backgroundName ?? null);

	const picker = useOverlay().create(CDrivePickerModal);
	async function pick() {
		const fileIds = await picker.open().result;
		const [fileId] = Array.isArray(fileIds) ? fileIds : [];
		if (fileId) {
			state.backgroundFileId = fileId;
			backgroundName.value = 'Gekozen bestand uit Drive';
		}
	}

	const { upload, uploading } = useDriveUpload();
	async function onFile(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		const result = file ? await upload([file]) : undefined;
		const uploaded = result?.files[0];
		if (uploaded) {
			state.backgroundFileId = uploaded.id;
			backgroundName.value = uploaded.name;
		}
	}

	function clearBackground() {
		state.backgroundFileId = null;
		backgroundName.value = null;
	}

	const { run: save, pending } = useAction(
		() =>
			props.plan
				? $fetch<FloorPlanView>(`/api/floor-plans/${props.plan.id}`, { method: 'PATCH', body: state })
				: $fetch<FloorPlanView>('/api/floor-plans', { method: 'POST', body: state }),
		{ success: 'Bewaard', onSuccess: (plan) => emit('close', plan) }
	);
</script>

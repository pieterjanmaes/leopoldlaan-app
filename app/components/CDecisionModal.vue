<template>
	<UModal
		:title="decision ? 'Beslissing bewerken' : 'Nieuwe beslissing'"
		:ui="{ content: 'sm:max-w-2xl' }">
		<template #body>
			<UForm
				:schema="decisionSchema"
				:state="state"
				class="space-y-4"
				@submit="save">
				<UFormField
					label="Wat"
					name="title"
					required>
					<UInput
						v-model="state.title"
						placeholder="Bv. vloertegels gelijkvloers"
						class="w-full"
						autofocus />
				</UFormField>

				<UFormField
					label="Status"
					name="status">
					<UTabs
						v-model="state.status"
						:items="statusItems"
						:content="false"
						size="sm" />
				</UFormField>

				<UFormField
					:label="state.status === 'open' ? 'Opties & overwegingen' : 'Wat is er beslist, en waarom'"
					name="body">
					<UTextarea
						v-model="body"
						:rows="5"
						autoresize
						:placeholder="
							state.status === 'open'
								? 'Optie A: … (voor/tegen)\nOptie B: …'
								: 'Gekozen voor … omdat …\nAndere opties: …'
						"
						class="w-full" />
				</UFormField>

				<UFormField
					label="Referentie"
					name="reference"
					description="Product, model, kleurcode, afmetingen… alles om het later opnieuw te bestellen.">
					<UInput
						v-model="reference"
						placeholder="Bv. Marazzi Mystone Grigio 60×60, mat, voeg antraciet"
						class="w-full" />
				</UFormField>

				<div class="grid gap-4 sm:grid-cols-2">
					<UFormField
						v-if="state.status === 'open'"
						label="Beslissen vóór"
						name="deadline">
						<CDateInput v-model="state.deadline" />
					</UFormField>
					<UFormField
						v-else
						label="Beslist op"
						name="decidedOn">
						<CDateInput v-model="state.decidedOn" />
					</UFormField>
					<UFormField
						label="Leverancier / aannemer"
						name="contactId">
						<USelectMenu
							v-model="state.contactId"
							:items="contactOptions"
							valueKey="value"
							placeholder="Geen"
							clear
							class="w-full" />
					</UFormField>
					<UFormField
						label="Ruimte"
						name="roomId">
						<USelectMenu
							v-model="state.roomId"
							:items="roomOptions"
							valueKey="value"
							placeholder="Geen"
							clear
							class="w-full" />
					</UFormField>
					<UFormField
						label="Werkpost"
						name="categoryId">
						<USelectMenu
							v-model="state.categoryId"
							:items="categoryOptions"
							valueKey="value"
							placeholder="Geen"
							clear
							class="w-full" />
					</UFormField>
					<UFormField
						label="Gekoppelde taak"
						name="taskId"
						class="sm:col-span-2">
						<USelectMenu
							v-model="state.taskId"
							:items="taskOptions"
							valueKey="value"
							placeholder="Geen"
							clear
							class="w-full" />
					</UFormField>
				</div>

				<p
					v-if="decision?.decidedBy && state.status !== 'open'"
					class="text-muted text-xs">
					Beslist door {{ decision.decidedBy.name
					}}{{ decision.decidedOn ? ` op ${formatDate(decision.decidedOn)}` : '' }}.
				</p>

				<CModalActions
					:loading="pending"
					@cancel="emit('close', false)">
					<UButton
						v-if="decision"
						label="Verwijder"
						icon="i-lucide-trash-2"
						color="error"
						variant="ghost"
						class="mr-auto"
						@click="remove" />
				</CModalActions>
			</UForm>

			<template v-if="decision">
				<USeparator class="my-6" />
				<h3 class="text-highlighted mb-3 font-semibold">Stalen, foto's & fiches</h3>
				<CAttachments
					entityType="decision"
					:entityId="decision.id" />
			</template>
		</template>
	</UModal>
</template>

<script setup lang="ts">
	import type * as z from 'zod';

	import { decisionSchema } from '#shared/schemas/decisions';

	const props = defineProps<{
		decision?: DecisionView | null;
		initial?: Partial<z.input<typeof decisionSchema>>;
	}>();

	const emit = defineEmits<{
		close: [saved: boolean];
	}>();

	useZodLocale();
	const { categoryOptions, contactOptions, roomOptions } = useLookups();
	const { tasks } = useTasks();

	const state = reactive<z.input<typeof decisionSchema>>({
		title: props.decision?.title ?? '',
		body: props.decision?.body ?? null,
		status: props.decision?.status ?? 'open',
		deadline: props.decision?.deadline ?? null,
		decidedOn: props.decision?.decidedOn ?? null,
		roomId: props.decision?.roomId ?? null,
		categoryId: props.decision?.categoryId ?? null,
		taskId: props.decision?.taskId ?? null,
		contactId: props.decision?.contactId ?? null,
		reference: props.decision?.reference ?? null,
		...props.initial
	});
	const body = useNullableText(state, 'body');
	const reference = useNullableText(state, 'reference');

	const statusItems = DECISION_STATUSES.map((status) => ({
		label: DECISION_STATUS_META[status].label,
		value: status,
		icon: DECISION_STATUS_META[status].icon
	}));
	const taskOptions = computed(() => tasks.value.map((task) => ({ label: task.title, value: task.id })));

	const { run: save, pending } = useAction(
		() =>
			props.decision
				? $fetch(`/api/decisions/${props.decision.id}`, { method: 'PATCH', body: state })
				: $fetch('/api/decisions', { method: 'POST', body: state }),
		{ success: 'Bewaard', onSuccess: () => emit('close', true) }
	);

	const { run: remove } = useAction(() => $fetch(`/api/decisions/${props.decision?.id}`, { method: 'DELETE' }), {
		confirm: () => ({ title: `"${props.decision?.title}" verwijderen?`, label: 'Verwijder' }),
		success: 'Beslissing verwijderd',
		onSuccess: () => emit('close', true)
	});
</script>

<template>
	<USlideover
		v-model:open="open"
		:title="detail?.title ?? 'Taak'"
		:ui="{ content: 'sm:max-w-xl' }">
		<template #description>
			<div
				v-if="detail"
				class="flex flex-wrap items-center gap-2">
				<UBadge
					:label="TASK_STATUS_META[detail.status].label"
					:icon="TASK_STATUS_META[detail.status].icon"
					:color="TASK_STATUS_META[detail.status].color"
					variant="subtle" />
				<UBadge
					v-if="detail.priority !== 'normal'"
					:label="`Prioriteit ${TASK_PRIORITY_META[detail.priority].label.toLowerCase()}`"
					:color="TASK_PRIORITY_META[detail.priority].color"
					variant="outline" />
			</div>
		</template>

		<template #body>
			<div
				v-if="!detail"
				class="space-y-3">
				<USkeleton class="h-8 w-2/3" />
				<USkeleton class="h-32 w-full" />
			</div>

			<div
				v-else
				class="space-y-6">
				<CTaskForm
					v-if="internal"
					:task="detail"
					:loading="saving"
					@submit="save">
					<template #actions>
						<UButton
							label="Verwijder"
							icon="i-lucide-trash-2"
							color="error"
							variant="ghost"
							class="mr-auto"
							@click="remove" />
					</template>
				</CTaskForm>

				<template v-else>
					<p
						v-if="detail.description"
						class="text-sm whitespace-pre-line">
						{{ detail.description }}
					</p>
					<CTaskMeta :task="detail" />
					<UFormField label="Status">
						<USelect
							:modelValue="detail.status"
							:items="statusOptions"
							class="w-full"
							@update:model-value="(status) => save({ status: status as TaskStatus })" />
					</UFormField>
				</template>

				<USeparator />

				<section class="space-y-3">
					<h3 class="text-highlighted font-semibold">Bestanden</h3>
					<CAttachments
						entityType="task"
						:entityId="detail.id"
						@changed="emit('changed')" />
				</section>

				<USeparator />

				<section class="space-y-3">
					<h3 class="text-highlighted font-semibold">Opmerkingen</h3>
					<ul
						v-if="detail.comments.length"
						class="space-y-3">
						<li
							v-for="entry in detail.comments"
							:key="entry.id"
							class="flex gap-3">
							<UAvatar
								:alt="entry.author?.name ?? '?'"
								size="sm" />
							<div class="min-w-0 flex-1">
								<p class="text-xs">
									<span class="text-highlighted font-medium">{{ entry.author?.name ?? 'Verwijderd' }}</span>
									<span class="text-muted"> · {{ formatDateTime(entry.createdAt) }}</span>
								</p>
								<p class="text-sm whitespace-pre-line">{{ entry.body }}</p>
							</div>
						</li>
					</ul>
					<form
						class="flex gap-2"
						@submit.prevent="addComment">
						<UTextarea
							v-model="comment"
							:rows="1"
							autoresize
							placeholder="Schrijf een opmerking…"
							class="flex-1" />
						<UButton
							type="submit"
							icon="i-lucide-send"
							aria-label="Plaats opmerking"
							:disabled="!comment.trim()"
							:loading="commenting" />
					</form>
				</section>
			</div>
		</template>
	</USlideover>
</template>

<script setup lang="ts">
	import type { TaskFormState } from './CTaskForm.vue';

	const props = defineProps<{
		taskId: string | null;
	}>();

	const emit = defineEmits<{
		close: [];
		changed: [];
	}>();

	const { user } = useUserSession();
	const internal = computed(() => isInternal(user.value));
	const comment = ref('');

	const open = computed({
		get: () => Boolean(props.taskId),
		set: (value) => {
			if (!value) emit('close');
		}
	});

	const { data: detail, refresh } = useFetch<TaskDetail>(() => `/api/tasks/${props.taskId}`, {
		immediate: false,
		watch: false
	});

	watch(
		() => props.taskId,
		async (id) => {
			detail.value = undefined;
			if (id) await refresh();
		},
		{ immediate: true }
	);

	const statusOptions = TASK_STATUSES.map((status) => ({ label: TASK_STATUS_META[status].label, value: status }));

	const { run: save, pending: saving } = useAction(
		(state: Partial<TaskFormState>) => $fetch<TaskView>(`/api/tasks/${props.taskId}`, { method: 'PATCH', body: state }),
		{
			success: 'Bewaard',
			onSuccess: async () => {
				await refresh();
				emit('changed');
			}
		}
	);

	const { run: remove } = useAction(() => $fetch(`/api/tasks/${props.taskId}`, { method: 'DELETE' }), {
		confirm: () => ({ title: `"${detail.value?.title}" verwijderen?`, label: 'Verwijder' }),
		success: 'Taak verwijderd',
		onSuccess: () => {
			emit('changed');
			emit('close');
		}
	});

	const { run: addComment, pending: commenting } = useAction(
		() => $fetch<CommentView>(`/api/tasks/${props.taskId}/comments`, { method: 'POST', body: { body: comment.value } }),
		{
			onSuccess: async () => {
				comment.value = '';
				await refresh();
				emit('changed');
			}
		}
	);
</script>

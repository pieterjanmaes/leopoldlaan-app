<template>
	<button
		type="button"
		class="border-default bg-default hover:border-accented focus-visible:ring-primary w-full rounded-lg border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
		@click="emit('open', decision)">
		<div class="flex items-start gap-3">
			<UIcon
				:name="meta.icon"
				class="mt-0.5 size-5 shrink-0"
				:class="{
					'text-warning': decision.status === 'open',
					'text-success': decision.status === 'decided',
					'text-muted': decision.status === 'replaced'
				}" />
			<div class="min-w-0 flex-1 space-y-1.5">
				<div class="flex flex-wrap items-baseline justify-between gap-x-3">
					<p
						class="text-highlighted font-medium"
						:class="{ 'text-muted line-through': decision.status === 'replaced' }">
						{{ decision.title }}
					</p>
					<span
						v-if="dateLabel"
						class="text-xs"
						:class="overdue ? 'text-error font-medium' : 'text-muted'">
						{{ dateLabel }}
					</span>
				</div>
				<p
					v-if="decision.reference"
					class="text-default text-sm">
					{{ decision.reference }}
				</p>
				<p
					v-if="decision.body"
					class="text-muted line-clamp-2 text-sm whitespace-pre-line">
					{{ decision.body }}
				</p>
				<div class="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
					<span
						v-if="category"
						class="flex items-center gap-1">
						<CCategoryDot :color="category.color" />
						{{ category.name }}
					</span>
					<span
						v-if="room"
						class="flex items-center gap-1">
						<UIcon
							name="i-lucide-door-closed"
							class="size-3.5" />
						{{ room.name }}
					</span>
					<span
						v-if="contact"
						class="flex items-center gap-1">
						<UIcon
							name="i-lucide-hard-hat"
							class="size-3.5" />
						{{ contact.name }}
					</span>
					<span
						v-if="decision.attachmentCount"
						class="flex items-center gap-1">
						<UIcon
							name="i-lucide-paperclip"
							class="size-3.5" />
						{{ decision.attachmentCount }}
					</span>
					<span
						v-if="decision.decidedBy && decision.status === 'decided'"
						class="flex items-center gap-1">
						<UIcon
							name="i-lucide-user-check"
							class="size-3.5" />
						{{ decision.decidedBy.name }}
					</span>
				</div>
			</div>
		</div>
	</button>
</template>

<script setup lang="ts">
	const props = defineProps<{
		decision: DecisionView;
	}>();

	const emit = defineEmits<{
		open: [decision: DecisionView];
	}>();

	const { categories, rooms, contacts } = useLookups();
	const today = todayIso();

	const meta = computed(() => DECISION_STATUS_META[props.decision.status]);
	const category = computed(() =>
		props.decision.categoryId ? categories.value.get(props.decision.categoryId) : undefined
	);
	const room = computed(() => (props.decision.roomId ? rooms.value.get(props.decision.roomId) : undefined));
	const contact = computed(() => (props.decision.contactId ? contacts.value.get(props.decision.contactId) : undefined));
	const overdue = computed(
		() => props.decision.status === 'open' && Boolean(props.decision.deadline && props.decision.deadline < today)
	);
	const dateLabel = computed(() => {
		if (props.decision.status === 'open') {
			return props.decision.deadline ? `beslissen ${dueLabel(props.decision.deadline, today)}` : '';
		}

		return props.decision.decidedOn ? `beslist ${formatDate(props.decision.decidedOn)}` : '';
	});
</script>

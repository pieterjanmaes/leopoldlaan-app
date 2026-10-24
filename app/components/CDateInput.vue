<template>
	<UInputDate
		v-model="calendarDate"
		locale="nl-BE"
		class="w-full">
		<template #trailing>
			<UPopover>
				<UButton
					color="neutral"
					variant="link"
					size="sm"
					icon="i-lucide-calendar"
					aria-label="Kies een datum"
					class="px-0" />
				<template #content>
					<UCalendar
						v-model="calendarDate"
						locale="nl-BE"
						class="p-2" />
				</template>
			</UPopover>
			<UButton
				v-if="model"
				color="neutral"
				variant="link"
				size="sm"
				icon="i-lucide-x"
				aria-label="Wis datum"
				class="px-0"
				@click="model = null" />
		</template>
	</UInputDate>
</template>

<script setup lang="ts">
	import { CalendarDate, parseDate } from '@internationalized/date';

	/** Date picker whose model is a 'YYYY-MM-DD' string, like the API. */
	const model = defineModel<string | null | undefined>();

	const calendarDate = computed<CalendarDate | undefined>({
		get: () => (model.value ? parseDate(model.value) : undefined),
		set: (value) => {
			model.value = value ? value.toString() : null;
		}
	});
</script>

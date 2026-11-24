<template>
	<UDashboardPanel
		:id="id"
		:ui="{ body: 'pb-28 lg:pb-6' }">
		<template #header>
			<UDashboardNavbar :title="title">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>
				<template #right>
					<slot name="actions" />
				</template>
			</UDashboardNavbar>
			<UDashboardToolbar v-if="$slots.toolbar">
				<slot name="toolbar" />
			</UDashboardToolbar>
		</template>

		<template #body>
			<div
				class="mx-auto w-full space-y-6"
				:class="wide ? 'max-w-none' : 'max-w-5xl'">
				<slot />
			</div>
		</template>
	</UDashboardPanel>
</template>

<script setup lang="ts">
	/** Page shell: navbar with the title (also the document title), optional toolbar, room for the mobile bottom bar. */
	const props = defineProps<{
		id: string;
		title: string;
		wide?: boolean;
	}>();

	useSeoMeta({ title: () => props.title });
</script>

<template>
	<UDashboardGroup unit="rem">
		<UDashboardSidebar
			id="default"
			v-model:open="open"
			collapsible
			resizable
			class="bg-elevated/25">
			<template #header="{ collapsed }">
				<CLogo
					:iconOnly="collapsed"
					:name="project?.name"
					class="px-1" />
			</template>

			<template #default="{ collapsed }">
				<UDashboardSearchButton
					:collapsed="collapsed"
					label="Zoeken…"
					class="ring-default bg-transparent" />

				<UNavigationMenu
					:collapsed="collapsed"
					:items="primaryLinks"
					orientation="vertical" />

				<UNavigationMenu
					v-if="secondaryLinks.length > 0"
					:collapsed="collapsed"
					:items="secondaryLinks"
					orientation="vertical"
					class="mt-auto" />
			</template>

			<template #footer="{ collapsed }">
				<CUserMenu :collapsed="collapsed" />
			</template>
		</UDashboardSidebar>

		<UDashboardSearch
			:groups="searchGroups"
			placeholder="Zoek een taak of pagina…" />

		<slot />

		<!-- Thumb-reachable navigation on phones, where the sidebar is hidden behind a menu button. -->
		<nav
			aria-label="Ga naar"
			class="bg-default/95 border-default fixed inset-x-0 bottom-0 z-40 grid border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
			:style="{ gridTemplateColumns: `repeat(${primaryLinks.length}, minmax(0, 1fr))` }">
			<NuxtLink
				v-for="link in primaryLinks"
				:key="String(link.to)"
				:to="link.to"
				class="text-muted flex flex-col items-center gap-0.5 py-2 text-xs"
				activeClass="text-primary"
				:exactActiveClass="link.to === '/' ? 'text-primary' : undefined">
				<UIcon
					:name="String(link.icon)"
					class="size-6" />
				{{ link.label }}
			</NuxtLink>
		</nav>
	</UDashboardGroup>
</template>

<script setup lang="ts">
	import type { CommandPaletteItem, NavigationMenuItem } from '@nuxt/ui';

	// Links feed both UNavigationMenu and UDashboardSearch, so they must satisfy both item types.
	type Link = NavigationMenuItem & CommandPaletteItem;

	const { user } = useUserSession();
	const open = ref(false);
	const internal = computed(() => isInternal(user.value));

	useDashboardShortcuts();

	const { data: project } = useFetch<ProjectView>('/api/project', { key: 'project', lazy: true });
	const { data: tasks } = useFetch<TaskView[]>('/api/tasks', { key: 'tasks', lazy: true });

	function toLink(entry: NavEntry): Link {
		return {
			label: entry.label,
			icon: entry.icon,
			to: entry.to,
			kbds: entry.shortcut?.split('-'),
			onSelect: () => {
				open.value = false;
			}
		};
	}

	const visible = (entries: NavEntry[]) => entries.filter((entry) => internal.value || entry.external);
	const primaryLinks = computed<Link[]>(() => visible(PRIMARY_NAV).map(toLink));
	const secondaryLinks = computed<Link[]>(() => visible(SECONDARY_NAV).map(toLink));

	const searchGroups = computed(() => [
		{ id: 'links', label: 'Ga naar', items: [...primaryLinks.value, ...secondaryLinks.value] },
		{
			id: 'tasks',
			label: 'Taken',
			items: (tasks.value ?? []).map((task) => ({
				label: task.title,
				icon: TASK_STATUS_META[task.status].icon,
				suffix: TASK_STATUS_META[task.status].label,
				to: { path: '/taken', query: { taak: task.id } }
			}))
		}
	]);
</script>

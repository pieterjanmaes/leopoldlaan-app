<template>
	<UDropdownMenu
		:items="menuItems"
		:content="{ align: 'start' }"
		class="w-full">
		<UButton
			color="neutral"
			variant="ghost"
			block
			:square="collapsed"
			class="justify-start gap-3">
			<UAvatar
				:alt="user?.name"
				size="sm" />
			<div
				v-if="!collapsed"
				class="min-w-0 flex-1 text-left">
				<p class="truncate text-sm font-medium">{{ user?.name }}</p>
				<p class="text-muted truncate text-xs">{{ user ? USER_ROLE_LABELS[user.role] : '' }}</p>
			</div>
			<UIcon
				v-if="!collapsed"
				name="i-lucide-chevrons-up-down"
				class="text-muted size-4" />
		</UButton>
	</UDropdownMenu>
</template>

<script setup lang="ts">
	import type { DropdownMenuItem } from '@nuxt/ui';

	defineProps<{
		collapsed?: boolean;
	}>();

	const { user } = useUserSession();
	const logout = useLogout();
	const colorMode = useColorMode();
	const { canInstall, installApp } = useInstallApp();

	const menuItems = computed<DropdownMenuItem[][]>(() => [
		[{ label: user.value?.email ?? '', type: 'label' }],
		[
			{ label: 'Mijn account', icon: 'i-lucide-user', to: '/account' },
			...(canInstall.value ? [{ label: 'Installeer als app', icon: 'i-lucide-smartphone', onSelect: installApp }] : []),
			{
				label: colorMode.value === 'dark' ? 'Lichte modus' : 'Donkere modus',
				icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
				onSelect: (event: Event) => {
					event.preventDefault();
					colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
				}
			}
		],
		[{ label: 'Afmelden', icon: 'i-lucide-log-out', onSelect: logout }]
	]);
</script>

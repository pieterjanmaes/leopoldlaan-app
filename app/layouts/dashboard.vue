<template>
	<UDashboardGroup>
		<UDashboardSidebar>
			<template #header>
				<UButton
					to="/"
					icon="i-lucide-home"
					label="Dashboard"
					color="neutral"
					variant="ghost" />
			</template>

			<template #default>
				<UNavigationMenu
					:items="navigationItems"
					orientation="vertical" />
			</template>

			<template #footer>
				<div class="flex items-center gap-2 p-2">
					<UAvatar
						:alt="user?.name || user?.email"
						size="sm" />

					<div class="flex-1 truncate text-sm">
						{{ user?.email }}
					</div>

					<UButton
						icon="i-lucide-log-out"
						color="neutral"
						variant="ghost"
						size="sm"
						@click="onLogout" />
				</div>
			</template>
		</UDashboardSidebar>

		<slot />
	</UDashboardGroup>
</template>

<script setup lang="ts">
	const { user, clear: logout } = useUserSession();
	const toast = useToast();

	const navigationItems = computed(() => {
		const items = [
			{
				label: 'Form Submissions',
				icon: 'i-lucide-inbox',
				to: '/dashboard'
			}
		];

		if (user.value?.role === 'superadmin') {
			items.push({
				label: 'Users',
				icon: 'i-lucide-users',
				to: '/dashboard/users'
			});
		}

		return items;
	});

	async function onLogout() {
		await $fetch('/api/auth/logout', { method: 'POST' });
		await logout();

		toast.add({
			title: 'Logged out',
			description: 'You have been logged out.',
			color: 'success'
		});

		await navigateTo('/dashboard/login');
	}
</script>

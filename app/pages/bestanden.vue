<template>
	<CPage
		id="files"
		title="Bestanden"
		wide>
		<template #actions>
			<UButton
				v-if="status?.connected && status.rootFolderId"
				:to="`https://drive.google.com/drive/folders/${status.rootFolderId}`"
				target="_blank"
				icon="i-lucide-external-link"
				label="Open in Drive"
				color="neutral"
				variant="outline" />
		</template>

		<UEmpty
			v-if="status && !status.connected"
			icon="i-lucide-hard-drive"
			title="Google Drive is nog niet gekoppeld"
			:description="
				isOwner(user)
					? 'Koppel jullie Drive in Instellingen; alle bestanden komen dan in één projectmap.'
					: 'Vraag de eigenaar om Google Drive te koppelen in Instellingen.'
			"
			:actions="
				isOwner(user) ? [{ label: 'Naar instellingen', to: '/instellingen#drive', icon: 'i-lucide-settings' }] : []
			" />

		<CDriveBrowser v-else-if="status?.connected" />
	</CPage>
</template>

<script setup lang="ts">
	definePageMeta({ middleware: 'internal' });

	const { user } = useUserSession();
	const { data: status } = await useFetch<DriveStatus>('/api/drive/status', { key: 'drive-status' });
</script>

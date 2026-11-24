<template>
	<CPage
		id="settings"
		title="Instellingen">
		<UPageCard
			title="Project"
			variant="subtle">
			<UForm
				:schema="projectSchema"
				:state="project"
				class="grid gap-4 sm:grid-cols-2"
				@submit="saveProject">
				<UFormField
					label="Naam"
					name="name"
					class="sm:col-span-2">
					<UInput
						v-model="project.name"
						class="w-full" />
				</UFormField>
				<UFormField
					label="Adres"
					name="address"
					class="sm:col-span-2">
					<UInput
						v-model="address"
						class="w-full" />
				</UFormField>
				<UFormField
					label="Start werken"
					name="startDate">
					<CDateInput v-model="project.startDate" />
				</UFormField>
				<UFormField
					label="Gewenste einddatum"
					name="targetEndDate">
					<CDateInput v-model="project.targetEndDate" />
				</UFormField>
				<UFormField
					label="Buffer onvoorzien"
					name="contingencyPercent"
					description="Reken 10 à 15% bovenop het budget voor verrassingen.">
					<UInputNumber
						v-model="project.contingencyPercent"
						:min="0"
						:max="100"
						:formatOptions="{ style: 'unit', unit: 'percent' }"
						class="w-full" />
				</UFormField>
				<div class="flex items-end justify-end">
					<UButton
						type="submit"
						label="Bewaar project"
						:loading="savingProject" />
				</div>
			</UForm>
		</UPageCard>

		<UPageCard
			id="drive"
			title="Google Drive"
			description="Alle bestanden komen in één projectmap in jullie Drive. Externen hebben geen Google-account nodig."
			variant="subtle">
			<UAlert
				v-if="driveNotice"
				:icon="driveNotice.icon"
				:color="driveNotice.color"
				variant="subtle"
				:title="driveNotice.title"
				:description="driveNotice.description" />

			<UAlert
				v-if="drive && !drive.configured"
				icon="i-lucide-key-round"
				color="warning"
				variant="subtle"
				title="Nog niet geconfigureerd"
				description="Zet NUXT_OAUTH_GOOGLE_CLIENT_ID, NUXT_OAUTH_GOOGLE_CLIENT_SECRET en NUXT_DRIVE_TOKEN_KEY (zie README)." />

			<template v-else-if="drive?.connected">
				<dl class="grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
					<dt class="text-muted">Gekoppeld account</dt>
					<dd>{{ drive.googleEmail }}</dd>
					<dt class="text-muted">Projectmap</dt>
					<dd>
						<ULink
							v-if="drive.rootFolderId"
							:to="`https://drive.google.com/drive/folders/${drive.rootFolderId}`"
							target="_blank">
							{{ drive.rootFolderName }}
						</ULink>
						<span v-else>—</span>
					</dd>
				</dl>
				<form
					v-if="owner"
					class="flex gap-2"
					@submit.prevent="setRoot">
					<UInput
						v-model="rootInput"
						placeholder="Plak de link van een andere Drive-map"
						class="flex-1" />
					<UButton
						type="submit"
						label="Gebruik deze map"
						color="neutral"
						variant="outline"
						:disabled="!rootInput.trim()"
						:loading="settingRoot" />
				</form>
			</template>

			<div
				v-if="owner && drive?.configured"
				class="flex gap-2">
				<UButton
					to="/auth/google-drive"
					external
					icon="i-lucide-hard-drive"
					:label="drive.connected ? 'Opnieuw koppelen' : 'Koppel Google Drive'" />
				<UButton
					v-if="drive.connected"
					label="Ontkoppel"
					color="error"
					variant="ghost"
					@click="disconnect" />
			</div>
		</UPageCard>

		<CCatalogSection
			kind="categories"
			title="Werkposten"
			description="Soorten werk, zoals elektriciteit of sanitair. Ze kleuren de planning en verdelen het budget."
			addLabel="Werkpost"
			:items="lookups.categories"
			@changed="refreshLookups" />

		<CCatalogSection
			kind="rooms"
			title="Ruimtes"
			addLabel="Ruimte"
			:items="lookups.rooms"
			@changed="refreshLookups" />

		<CCatalogSection
			kind="phases"
			title="Fases & mijlpalen"
			description="Grote stappen van de verbouwing, en vaste momenten zoals de keuring of de verhuis."
			addLabel="Fase"
			:items="lookups.phases"
			@changed="refreshLookups" />

		<UPageCard
			v-if="owner"
			title="Gebruikers"
			description="Huisgenoten zien alles; externen enkel de taken die aan hen zijn toegewezen."
			variant="subtle">
			<ul class="divide-default divide-y">
				<li
					v-for="member in users"
					:key="member.id"
					class="flex flex-wrap items-center gap-3 py-2">
					<UAvatar
						:alt="member.name"
						size="sm" />
					<div class="min-w-0 flex-1">
						<p class="text-highlighted truncate text-sm font-medium">{{ member.name }}</p>
						<p class="text-muted truncate text-xs">
							{{ member.email }}
							<template v-if="member.contactId"> · {{ contacts.get(member.contactId)?.name }}</template>
						</p>
					</div>
					<USelect
						:modelValue="member.role"
						:items="roleOptions"
						:disabled="member.id === user?.id"
						size="sm"
						class="w-36"
						@update:model-value="(role) => updateUser(member, { role: role as UserRole })" />
					<USelectMenu
						v-if="member.role === 'external'"
						:modelValue="member.contactId ?? undefined"
						:items="contactOptions"
						valueKey="value"
						placeholder="Contact"
						size="sm"
						class="w-40"
						@update:model-value="(contactId) => updateUser(member, { contactId: (contactId as string) ?? null })" />
					<UButton
						icon="i-lucide-trash-2"
						color="neutral"
						variant="ghost"
						size="sm"
						aria-label="Verwijder gebruiker"
						:disabled="member.id === user?.id"
						@click="removeUser(member)" />
				</li>
			</ul>

			<template v-if="invites?.length">
				<p class="text-muted text-xs font-semibold tracking-wide uppercase">Openstaande uitnodigingen</p>
				<ul class="divide-default divide-y">
					<li
						v-for="pending in invites"
						:key="pending.id"
						class="flex items-center gap-3 py-2 text-sm">
						<UIcon
							name="i-lucide-mail"
							class="text-muted size-4" />
						<span class="min-w-0 flex-1 truncate">{{ pending.email }}</span>
						<UBadge
							:label="USER_ROLE_LABELS[pending.role]"
							color="neutral"
							variant="subtle" />
						<span class="text-muted hidden text-xs sm:inline">tot {{ formatDateTime(pending.expiresAt) }}</span>
						<UButton
							icon="i-lucide-x"
							color="neutral"
							variant="ghost"
							size="sm"
							aria-label="Trek uitnodiging in"
							@click="revokeInvite(pending)" />
					</li>
				</ul>
			</template>

			<div>
				<UButton
					icon="i-lucide-user-plus"
					label="Iemand uitnodigen"
					@click="invite" />
			</div>
		</UPageCard>
	</CPage>
</template>

<script setup lang="ts">
	import { CInviteModal } from '#components';
	import { projectSchema } from '#shared/schemas/catalog';

	definePageMeta({ middleware: 'internal' });
	useZodLocale();

	const route = useRoute();
	const { user } = useUserSession();
	const owner = computed(() => isOwner(user.value));
	const { lookups, refresh: refreshLookups, contacts, contactOptions } = useLookups();

	const { data: projectData, refresh: refreshProject } = await useFetch<ProjectView>('/api/project', {
		key: 'project'
	});
	const project = reactive<ProjectView>({
		name: '',
		address: null,
		startDate: null,
		targetEndDate: null,
		contingencyPercent: DEFAULT_CONTINGENCY_PERCENT
	});
	watch(projectData, (value) => value && Object.assign(project, value), { immediate: true });
	const address = useNullableText(project, 'address');

	const { run: saveProject, pending: savingProject } = useAction(
		() => $fetch('/api/project', { method: 'PATCH', body: project }),
		{ success: 'Project bewaard', onSuccess: () => refreshProject() }
	);

	// Drive
	const { data: drive, refresh: refreshDrive } = await useFetch<DriveStatus>('/api/drive/status', {
		key: 'drive-status'
	});
	const rootInput = ref('');

	const DRIVE_NOTICES: Record<string, { title: string; description?: string; color: BadgeColor; icon: string }> = {
		connected: { title: 'Google Drive is gekoppeld', color: 'success', icon: 'i-lucide-circle-check' },
		error: {
			title: 'Koppelen is mislukt',
			description: 'Probeer opnieuw, en geef toegang tot Drive in het Google-scherm.',
			color: 'error',
			icon: 'i-lucide-circle-x'
		},
		'no-refresh-token': {
			title: 'Google gaf geen blijvende toegang',
			description: 'Verwijder de app bij myaccount.google.com → Beveiliging → Apps van derden, en koppel opnieuw.',
			color: 'warning',
			icon: 'i-lucide-triangle-alert'
		}
	};
	const driveNotice = computed(() =>
		typeof route.query.drive === 'string' ? DRIVE_NOTICES[route.query.drive] : undefined
	);

	const { run: setRoot, pending: settingRoot } = useAction(
		() => $fetch('/api/drive/root', { method: 'PUT', body: { folder: rootInput.value } }),
		{
			success: 'Projectmap gewijzigd',
			onSuccess: async () => {
				rootInput.value = '';
				await refreshDrive();
			}
		}
	);

	const { run: disconnect } = useAction(() => $fetch('/api/drive/connection', { method: 'DELETE' }), {
		confirm: () => ({
			title: 'Google Drive ontkoppelen? De bestanden blijven in Drive staan.',
			label: 'Ontkoppel'
		}),
		success: 'Drive ontkoppeld',
		onSuccess: () => refreshDrive()
	});

	// Users
	const { data: users, refresh: refreshUsers } = await useFetch<UserView[]>('/api/users', {
		key: 'users',
		immediate: owner.value,
		default: () => []
	});
	const { data: invites, refresh: refreshInvites } = await useFetch<InviteView[]>('/api/invites', {
		key: 'invites',
		immediate: owner.value,
		default: () => []
	});
	const roleOptions = USER_ROLES.map((role) => ({ label: USER_ROLE_LABELS[role], value: role }));

	const { run: updateUser } = useAction(
		(member: UserView, body: Partial<Pick<UserView, 'role' | 'contactId'>>) =>
			$fetch(`/api/users/${member.id}`, { method: 'PATCH', body }),
		{ success: 'Bewaard', onSuccess: () => refreshUsers() }
	);

	const { run: removeUser } = useAction((member: UserView) => $fetch(`/api/users/${member.id}`, { method: 'DELETE' }), {
		confirm: (member) => ({ title: `${member.name} verwijderen?`, label: 'Verwijder' }),
		success: 'Gebruiker verwijderd',
		onSuccess: () => refreshUsers()
	});

	const { run: revokeInvite } = useAction(
		(inviteToRevoke: InviteView) => $fetch(`/api/invites/${inviteToRevoke.id}`, { method: 'DELETE' }),
		{ onSuccess: () => refreshInvites() }
	);

	const inviteModal = useOverlay().create(CInviteModal);
	async function invite() {
		await inviteModal.open().result;
		await refreshInvites();
	}
</script>

<template>
	<CPage
		id="account"
		title="Mijn account">
		<UPageCard
			title="Gegevens"
			variant="subtle">
			<dl class="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
				<dt class="text-muted">Naam</dt>
				<dd>{{ user?.name }}</dd>
				<dt class="text-muted">E-mailadres</dt>
				<dd>{{ user?.email }}</dd>
				<dt class="text-muted">Rol</dt>
				<dd>{{ user ? USER_ROLE_LABELS[user.role] : '' }}</dd>
			</dl>
		</UPageCard>

		<UPageCard
			v-if="canInstall"
			title="App op je gsm"
			description="Zet de app op je beginscherm: één tik om te openen, schermvullend, en foto's nemen op de werf gaat sneller."
			variant="subtle">
			<div>
				<UButton
					icon="i-lucide-smartphone"
					label="Installeer als app"
					@click="installApp" />
			</div>
		</UPageCard>

		<UPageCard
			title="Wachtwoord wijzigen"
			description="Andere toestellen worden daarna afgemeld."
			variant="subtle">
			<UForm
				:schema="passwordChangeSchema"
				:state="state"
				class="space-y-4"
				@submit="changePassword">
				<UFormField
					label="Huidig wachtwoord"
					name="currentPassword">
					<UInput
						v-model="state.currentPassword"
						type="password"
						autocomplete="current-password"
						class="w-full" />
				</UFormField>
				<UFormField
					label="Nieuw wachtwoord"
					name="newPassword">
					<UInput
						v-model="state.newPassword"
						type="password"
						autocomplete="new-password"
						class="w-full" />
				</UFormField>
				<UButton
					type="submit"
					label="Wijzig wachtwoord"
					:loading="pending" />
			</UForm>
		</UPageCard>
	</CPage>
</template>

<script setup lang="ts">
	import { passwordChangeSchema } from '#shared/schemas/users';

	useZodLocale();

	const { user } = useUserSession();
	const { canInstall, installApp } = useInstallApp();
	const state = reactive({ currentPassword: '', newPassword: '' });

	const { run: changePassword, pending } = useAction(
		async () => {
			await $fetch('/api/me/password', { method: 'POST', body: state });
			state.currentPassword = '';
			state.newPassword = '';
		},
		{ success: 'Wachtwoord gewijzigd' }
	);
</script>

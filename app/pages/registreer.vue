<template>
	<UPageCard class="w-full max-w-md">
		<UAlert
			v-if="!invite"
			color="warning"
			variant="subtle"
			icon="i-lucide-mail-question"
			title="Je hebt een uitnodiging nodig om een account te maken." />
		<UAlert
			v-else-if="inviteError"
			color="error"
			variant="subtle"
			icon="i-lucide-link-2-off"
			title="Deze uitnodiging is ongeldig of al gebruikt." />
		<UAuthForm
			v-else
			:schema="schema"
			title="Account aanmaken"
			:description="description"
			icon="i-lucide-user-plus"
			:fields="fields"
			:loading="loading"
			:submit="{ label: 'Account aanmaken' }"
			@submit="onSubmit" />
	</UPageCard>
</template>

<script setup lang="ts">
	import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui';
	import type * as z from 'zod';

	import { registerSchema } from '#shared/schemas/auth';

	definePageMeta({ layout: 'auth' });
	useSeoMeta({ title: 'Account aanmaken' });
	useZodLocale();

	const route = useRoute();
	const { fetch: refreshSession } = useUserSession();

	const invite = computed(() => (typeof route.query.invite === 'string' ? route.query.invite : ''));
	const { data: inviteInfo, error: inviteError } = await useFetch<InviteLookup>('/api/invites/lookup', {
		query: { token: invite },
		immediate: Boolean(invite.value)
	});

	const description = computed(() => {
		const info = inviteInfo.value;
		if (!info) {
			return undefined;
		}

		return `${info.inviterName ?? 'Iemand'} nodigde ${info.email} uit om mee te volgen.`;
	});

	const schema = registerSchema.omit({ invite: true });
	const fields = computed<AuthFormField[]>(() => [
		{
			name: 'name',
			type: 'text',
			label: 'Naam',
			autocomplete: 'name',
			defaultValue: inviteInfo.value?.name ?? undefined,
			required: true
		},
		{
			name: 'password',
			type: 'password',
			label: 'Wachtwoord',
			description: 'Minstens 8 tekens',
			autocomplete: 'new-password',
			required: true
		}
	]);

	const { run: onSubmit, pending: loading } = useAction(
		async (event: FormSubmitEvent<z.output<typeof schema>>) => {
			await $fetch('/api/auth/register', { method: 'POST', body: { ...event.data, invite: invite.value } });
			await refreshSession();
			await navigateTo('/');
		},
		{ success: 'Welkom!' }
	);
</script>

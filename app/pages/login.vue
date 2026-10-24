<template>
	<UPageCard class="w-full max-w-md">
		<UAuthForm
			:schema="credentialsSchema"
			title="Aanmelden"
			description="Meld je aan om de verbouwing op te volgen."
			icon="i-lucide-log-in"
			:fields="fields"
			:loading="loading"
			:submit="{ label: 'Aanmelden' }"
			@submit="onSubmit">
			<template #validation>
				<NuxtTurnstile
					ref="turnstile"
					v-model="captchaToken"
					class="mt-2" />
			</template>
		</UAuthForm>
	</UPageCard>
</template>

<script setup lang="ts">
	import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui';
	import type * as z from 'zod';

	import { credentialsSchema } from '#shared/schemas/auth';

	type Credentials = FormSubmitEvent<z.output<typeof credentialsSchema>>;

	definePageMeta({ layout: 'auth' });
	useSeoMeta({ title: 'Aanmelden' });
	useZodLocale();

	const toast = useToast();
	const route = useRoute();
	const { fetch: refreshSession } = useUserSession();

	const captchaToken = ref('');
	const turnstile = useTemplateRef<{ reset: () => void }>('turnstile');

	const fields: AuthFormField[] = [
		{ name: 'email', type: 'email', label: 'E-mailadres', autocomplete: 'email', required: true },
		{ name: 'password', type: 'password', label: 'Wachtwoord', autocomplete: 'current-password', required: true }
	];

	/** Only same-site paths, so a crafted link can't bounce someone to another site after login. */
	function safeRedirect(value: unknown): string {
		return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
	}

	const { run: login, pending: loading } = useAction(
		async (event: Credentials) => {
			await $fetch('/api/auth/login', { method: 'POST', body: { ...event.data, captchaToken: captchaToken.value } });
			await refreshSession();
			await navigateTo(safeRedirect(route.query.redirect));
		},
		{ onError: () => turnstile.value?.reset() }
	);

	function onSubmit(event: Credentials) {
		if (!captchaToken.value) {
			toast.add({ title: 'Wacht even tot de captcha klaar is', color: 'warning' });
			return;
		}

		return login(event);
	}
</script>

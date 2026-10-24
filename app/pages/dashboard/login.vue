<template>
	<UPageCard class="w-full max-w-md">
		<UAuthForm
			:schema="schema"
			title="Login"
			description="Enter your credentials to access your account."
			icon="i-lucide-user"
			:fields="fields"
			:loading="isLoading"
			@submit="onSubmit">
			<template #validation>
				<UFormField
					name="captchaToken"
					required
					class="mt-4">
					<NuxtTurnstile v-model="captchaToken" />
				</UFormField>
			</template>
		</UAuthForm>
	</UPageCard>
</template>

<script setup lang="ts">
	import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui';
	import * as z from 'zod';

	const toast = useToast();
	const { fetch: refreshSession } = useUserSession();

	defineI18nRoute(false);

	definePageMeta({
		layout: 'login'
	});

	useZodLocale();

	const isLoading = ref(false);
	const captchaToken = ref('');

	const fields: AuthFormField[] = [
		{
			name: 'email',
			type: 'email',
			label: 'Email',
			placeholder: 'Enter your email',
			required: true
		},
		{
			name: 'password',
			label: 'Password',
			type: 'password',
			placeholder: 'Enter your password',
			required: true
		}
	];

	const schema = z.object({
		email: z.string().email('Invalid email'),
		password: z.string().min(8, 'Must be at least 8 characters')
	});

	type Schema = z.output<typeof schema>;

	async function onSubmit(payload: FormSubmitEvent<Schema>) {
		// Check captcha token before submitting
		if (!captchaToken.value) {
			toast.add({
				title: 'Error',
				description: 'Please complete the captcha',
				color: 'error'
			});
			return;
		}

		isLoading.value = true;

		try {
			await $fetch('/api/auth/login', {
				method: 'POST',
				body: {
					email: payload.data.email,
					password: payload.data.password,
					captchaToken: captchaToken.value
				}
			});

			await refreshSession();

			toast.add({
				title: 'Success',
				description: 'You have been logged in.',
				color: 'success'
			});

			await navigateTo('/dashboard');
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Login failed';
			toast.add({
				title: 'Error',
				description: errorMessage,
				color: 'error'
			});
			// Reset captcha on error so user can try again
			captchaToken.value = '';
		} finally {
			isLoading.value = false;
		}
	}
</script>

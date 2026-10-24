<template>
	<UForm
		:state
		:schema
		class="space-y-4"
		@submit="onSubmit">
		<UFormField
			name="firstName"
			:label="t('form.firstName')"
			required>
			<UInput
				v-model="state.firstName"
				:placeholder="t('form.firstName')" />
		</UFormField>

		<UFormField
			name="lastName"
			:label="t('form.lastName')"
			required>
			<UInput
				v-model="state.lastName"
				:placeholder="t('form.lastName')" />
		</UFormField>

		<UFormField
			name="email"
			:label="t('form.email')"
			required>
			<UInput
				v-model="state.email"
				type="email"
				:placeholder="t('form.email')" />
		</UFormField>

		<UFormField
			name="phone"
			:label="t('form.phone')">
			<CPhoneNumberInput v-model="state.phone" />
		</UFormField>

		<UFormField
			name="timeSlot"
			:label="t('form.timeSlot')"
			required>
			<USelect
				v-model="state.timeSlot"
				:items="timeSlotOptions"
				:placeholder="t('form.timeSlotPlaceholder')" />
		</UFormField>

		<UFormField
			name="privacyPolicy"
			class="mt-6">
			<UCheckbox v-model="state.privacyPolicy">
				<template #label>
					<i18n-t
						keypath="form.privacyPolicyLabel"
						tag="span"
						scope="global">
						<template #link>
							<NuxtLink
								:to="localePath('/privacy-policy')"
								target="_blank"
								class="underline">
								{{ t('form.privacyPolicyLink') }}
							</NuxtLink>
						</template>
					</i18n-t>
				</template>
			</UCheckbox>
		</UFormField>

		<UFormField
			name="captchaToken"
			required>
			<NuxtTurnstile v-model="state.captchaToken" />
		</UFormField>

		<UButton
			:loading="isSubmitting"
			type="submit"
			block>
			{{ t('form.submit') }}
		</UButton>
	</UForm>
</template>

<script setup lang="ts">
	import type { FormSubmitEvent } from '@nuxt/ui';
	import { z } from 'zod';

	useZodLocale();

	const { t } = useI18n();
	const localePath = useLocalePath();
	const toast = useToast();

	const timeSlotOptions = [
		{ label: '14:00', value: '14:00' },
		{ label: '15:00', value: '15:00' },
		{ label: '16:00', value: '16:00' },
		{ label: '17:00', value: '17:00' },
		{ label: '18:00', value: '18:00' }
	];

	const schema = computed(() =>
		z.object({
			firstName: z.string().min(1, t('form.errors.required')).max(256),
			lastName: z.string().min(1, t('form.errors.required')).max(256),
			email: z.email({ message: t('form.errors.invalidEmail') }),
			phone: z
				.string()
				.regex(/^\+[1-9]\d{6,14}$/, { message: t('form.errors.invalidPhone') })
				.optional()
				.or(z.literal('')),
			timeSlot: z.string().min(1, t('form.errors.required')),
			privacyPolicy: z.boolean().refine((val) => val === true, { message: t('form.errors.required') }),
			captchaToken: z.string({ message: t('form.errors.required') }).min(1, t('form.errors.required'))
		})
	);

	const state = reactive({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		timeSlot: '',
		privacyPolicy: false,
		captchaToken: ''
	});

	const isSubmitting = ref(false);

	type Schema = z.output<typeof schema.value>;

	async function onSubmit(event: FormSubmitEvent<Schema>) {
		isSubmitting.value = true;
		try {
			await $fetch('/api/form/submit', {
				method: 'POST',
				body: {
					firstName: event.data.firstName,
					lastName: event.data.lastName,
					email: event.data.email,
					phone: event.data.phone,
					timeSlot: event.data.timeSlot,
					captchaToken: event.data.captchaToken
				}
			});
			await navigateTo(localePath('/success'));
		} catch {
			toast.add({
				title: t('form.errors.general'),
				description: t('form.errors.tryAgain'),
				color: 'error'
			});
		} finally {
			isSubmitting.value = false;
		}
	}
</script>

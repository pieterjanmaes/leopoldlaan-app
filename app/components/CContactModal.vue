<template>
	<UModal :title="contact ? 'Contact bewerken' : 'Nieuw contact'">
		<template #body>
			<UForm
				:schema="contactSchema"
				:state="state"
				class="space-y-4"
				@submit="save">
				<div class="grid gap-4 sm:grid-cols-2">
					<UFormField
						label="Naam"
						name="name"
						required>
						<UInput
							v-model="state.name"
							class="w-full" />
					</UFormField>
					<UFormField
						label="Bedrijf"
						name="company">
						<UInput
							v-model="company"
							class="w-full" />
					</UFormField>
					<UFormField
						label="Vak"
						name="trade">
						<UInput
							v-model="trade"
							placeholder="Bv. elektricien"
							class="w-full" />
					</UFormField>
					<UFormField
						label="Btw-nummer"
						name="vatNumber">
						<UInput
							v-model="vatNumber"
							placeholder="BE0123.456.789"
							class="w-full" />
					</UFormField>
					<UFormField
						label="E-mailadres"
						name="email">
						<UInput
							v-model="email"
							type="email"
							class="w-full" />
					</UFormField>
					<UFormField
						label="Telefoon"
						name="phone">
						<UInput
							v-model="phone"
							type="tel"
							class="w-full" />
					</UFormField>
				</div>
				<UFormField
					label="Notities"
					name="notes">
					<UTextarea
						v-model="notes"
						autoresize
						class="w-full" />
				</UFormField>
				<CModalActions
					:loading="pending"
					@cancel="emit('close', false)" />
			</UForm>
		</template>
	</UModal>
</template>

<script setup lang="ts">
	import type * as z from 'zod';

	import { contactSchema } from '#shared/schemas/catalog';

	const props = defineProps<{
		contact?: ContactView | null;
	}>();

	const emit = defineEmits<{
		close: [saved: boolean];
	}>();

	useZodLocale();

	const state = reactive<z.input<typeof contactSchema>>({
		name: props.contact?.name ?? '',
		company: props.contact?.company ?? null,
		trade: props.contact?.trade ?? null,
		email: props.contact?.email ?? null,
		phone: props.contact?.phone ?? null,
		vatNumber: props.contact?.vatNumber ?? null,
		notes: props.contact?.notes ?? null
	});
	const company = useNullableText(state, 'company');
	const trade = useNullableText(state, 'trade');
	const email = useNullableText(state, 'email');
	const phone = useNullableText(state, 'phone');
	const vatNumber = useNullableText(state, 'vatNumber');
	const notes = useNullableText(state, 'notes');

	const { run: save, pending } = useAction(
		() =>
			props.contact
				? $fetch(`/api/contacts/${props.contact.id}`, { method: 'PATCH', body: state })
				: $fetch('/api/contacts', { method: 'POST', body: state }),
		{ success: 'Bewaard', onSuccess: () => emit('close', true) }
	);
</script>

<template>
	<UModal
		title="Iemand uitnodigen"
		description="Je krijgt een link om door te sturen; die blijft 14 dagen geldig.">
		<template #body>
			<div
				v-if="created?.url"
				class="space-y-4">
				<UAlert
					icon="i-lucide-link"
					color="success"
					variant="subtle"
					title="Uitnodiging klaar"
					description="Kopieer de link nu: hij wordt om veiligheidsredenen niet bewaard." />
				<UInput
					:modelValue="created.url"
					readonly
					class="w-full"
					:ui="{ trailing: 'pe-1' }">
					<template #trailing>
						<UButton
							:icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
							color="neutral"
							variant="link"
							aria-label="Kopieer link"
							@click="copy(created.url)" />
					</template>
				</UInput>
				<div class="flex justify-end gap-2">
					<UButton
						:to="mailto"
						icon="i-lucide-mail"
						label="Mail de link"
						color="neutral"
						variant="outline" />
					<UButton
						label="Klaar"
						@click="emit('close', true)" />
				</div>
			</div>

			<UForm
				v-else
				:schema="inviteSchema"
				:state="state"
				class="space-y-4"
				@submit="send">
				<UFormField
					label="E-mailadres"
					name="email"
					required>
					<UInput
						v-model="state.email"
						type="email"
						class="w-full" />
				</UFormField>
				<UFormField
					label="Naam"
					name="name">
					<UInput
						v-model="name"
						class="w-full" />
				</UFormField>
				<UFormField
					label="Rol"
					name="role">
					<URadioGroup
						v-model="state.role"
						:items="roleItems" />
				</UFormField>
				<UFormField
					v-if="state.role === 'external'"
					label="Gekoppeld contact"
					name="contactId"
					description="De externe ziet enkel taken die aan dit contact zijn toegewezen.">
					<USelectMenu
						v-model="state.contactId"
						:items="contactOptions"
						valueKey="value"
						clear
						class="w-full" />
				</UFormField>
				<CModalActions
					submitLabel="Maak uitnodiging"
					:loading="pending"
					@cancel="emit('close', false)" />
			</UForm>
		</template>
	</UModal>
</template>

<script setup lang="ts">
	import type * as z from 'zod';

	import { inviteSchema } from '#shared/schemas/users';

	const emit = defineEmits<{
		close: [created: boolean];
	}>();

	useZodLocale();
	const { contactOptions } = useLookups();
	const { copy, copied } = useClipboard();

	const state = reactive<z.input<typeof inviteSchema>>({ email: '', name: null, role: 'external', contactId: null });
	const name = useNullableText(state, 'name');
	const created = ref<InviteView | null>(null);

	const roleItems = [
		{ label: 'Extern', value: 'external', description: 'Aannemer of familie: ziet enkel eigen taken, geen budget.' },
		{ label: 'Huisgenoot', value: 'member', description: 'Ziet en bewerkt alles, behalve gebruikersbeheer.' },
		{ label: 'Eigenaar', value: 'owner', description: 'Alles, ook gebruikers en de Drive-koppeling.' }
	];

	const mailto = computed(
		() =>
			`mailto:${encodeURIComponent(state.email)}?subject=${encodeURIComponent('Uitnodiging verbouwing')}&body=${encodeURIComponent(`Via deze link maak je een account aan: ${created.value?.url ?? ''}`)}`
	);

	const { run: send, pending } = useAction(() => $fetch<InviteView>('/api/invites', { method: 'POST', body: state }), {
		onSuccess: (invite) => {
			created.value = invite;
		}
	});
</script>

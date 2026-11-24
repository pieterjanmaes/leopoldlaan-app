<template>
	<CPage
		id="contacts"
		title="Contacten">
		<template #actions>
			<UButton
				icon="i-lucide-plus"
				label="Nieuw contact"
				@click="edit()" />
		</template>

		<UInput
			v-model="search"
			icon="i-lucide-search"
			placeholder="Zoek op naam, bedrijf of vak…"
			class="w-full" />

		<UEmpty
			v-if="filtered.length === 0"
			icon="i-lucide-contact"
			:title="search ? 'Niets gevonden' : 'Nog geen contacten'"
			description="Aannemers, leveranciers, architect, notaris… alles op één plek." />

		<div
			v-else
			class="grid gap-3 sm:grid-cols-2">
			<UPageCard
				v-for="contact in filtered"
				:key="contact.id"
				:title="contact.name"
				:description="[contact.trade, contact.company].filter(Boolean).join(' · ')"
				variant="outline">
				<div class="space-y-1 text-sm">
					<ULink
						v-if="contact.phone"
						:to="`tel:${contact.phone}`"
						class="flex items-center gap-2">
						<UIcon
							name="i-lucide-phone"
							class="size-4" />
						{{ contact.phone }}
					</ULink>
					<ULink
						v-if="contact.email"
						:to="`mailto:${contact.email}`"
						class="flex items-center gap-2">
						<UIcon
							name="i-lucide-mail"
							class="size-4" />
						{{ contact.email }}
					</ULink>
					<p
						v-if="openTaskCount(contact.id)"
						class="text-muted flex items-center gap-2">
						<UIcon
							name="i-lucide-list-checks"
							class="size-4" />
						{{ openTaskCount(contact.id) }} open {{ openTaskCount(contact.id) === 1 ? 'taak' : 'taken' }}
					</p>
				</div>
				<div class="-mb-2 flex w-full justify-end gap-1">
					<UButton
						icon="i-lucide-pencil"
						label="Bewerk"
						color="neutral"
						variant="ghost"
						size="sm"
						@click="edit(contact)" />
					<UButton
						icon="i-lucide-trash-2"
						color="neutral"
						variant="ghost"
						size="sm"
						aria-label="Verwijder"
						@click="remove(contact)" />
				</div>
			</UPageCard>
		</div>
	</CPage>
</template>

<script setup lang="ts">
	import { CContactModal } from '#components';

	definePageMeta({ middleware: 'internal' });

	const { lookups, refresh } = useLookups();
	const { tasks } = useTasks();
	const search = ref('');

	const filtered = computed(() => {
		const query = search.value.trim().toLowerCase();

		return lookups.value.contacts.filter((contact) =>
			[contact.name, contact.company, contact.trade].some((value) => value?.toLowerCase().includes(query))
		);
	});

	const openTaskCount = (contactId: string) =>
		tasks.value.filter((task) => task.assigneeContactId === contactId && task.status !== 'done').length;

	const modal = useOverlay().create(CContactModal);
	async function edit(contact: ContactView | null = null) {
		if (await modal.open({ contact }).result) await refresh();
	}

	const { run: remove } = useAction(
		async (contact: ContactView) => {
			await $fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' });
			await refresh();
		},
		{ confirm: (contact) => `${contact.name} verwijderen?`, success: 'Contact verwijderd' }
	);
</script>

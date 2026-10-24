<template>
	<UModal
		title="Op je beginscherm zetten"
		description="Dan open je de app met één tik, schermvullend, zoals een gewone app.">
		<template #body>
			<ol class="space-y-4 text-sm">
				<li class="flex gap-3">
					<span
						class="bg-primary text-inverted flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
						>1</span
					>
					<span>
						Tik in Safari onderaan op
						<UIcon
							name="i-lucide-share"
							class="text-primary mx-0.5 inline size-4 align-text-bottom" />
						<strong>Deel</strong>.
					</span>
				</li>
				<li class="flex gap-3">
					<span
						class="bg-primary text-inverted flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
						>2</span
					>
					<span>
						Scroll naar beneden en kies
						<UIcon
							name="i-lucide-square-plus"
							class="text-primary mx-0.5 inline size-4 align-text-bottom" />
						<strong>Zet op beginscherm</strong>.
					</span>
				</li>
				<li class="flex gap-3">
					<span
						class="bg-primary text-inverted flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
						>3</span
					>
					<span>Tik op <strong>Voeg toe</strong>. Het huisje verschijnt bij je andere apps.</span>
				</li>
			</ol>
		</template>
		<template #footer>
			<UButton
				label="Begrepen"
				class="ml-auto"
				@click="emit('close')" />
		</template>
	</UModal>
</template>

<script setup lang="ts">
	const emit = defineEmits<{
		close: [];
	}>();
</script>

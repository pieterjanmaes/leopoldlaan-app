<template>
	<CPage
		id="home"
		:title="dashboard?.project.name ?? 'Overzicht'">
		<template #actions>
			<UButton
				v-if="internal"
				to="/taken"
				icon="i-lucide-plus"
				label="Taak"
				color="neutral"
				variant="outline" />
		</template>

		<template v-if="dashboard">
			<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<CStatTile
					label="Open taken"
					icon="i-lucide-list-todo"
					:value="openCount"
					:hint="`${dashboard.taskCounts.in_progress} bezig · ${dashboard.taskCounts.waiting} wacht`" />
				<CStatTile
					label="Klaar"
					icon="i-lucide-circle-check"
					:value="`${progressPercent}%`"
					:hint="`${dashboard.taskCounts.done} van ${totalCount} taken`" />
				<template v-if="dashboard.budget">
					<CStatTile
						label="Verwachte kost"
						icon="i-lucide-wallet"
						:value="formatPriceRounded(dashboard.budget.totals.forecastCents)"
						:hint="`budget ${formatPriceRounded(dashboard.budget.totals.plannedCents)}`" />
					<CStatTile
						label="Te betalen"
						icon="i-lucide-receipt"
						:value="formatPriceRounded(dashboard.budget.unpaidCents)"
						:hint="`${dashboard.budget.unpaidCount} openstaande ${dashboard.budget.unpaidCount === 1 ? 'factuur' : 'facturen'}`" />
				</template>
			</div>

			<UProgress
				:modelValue="progressPercent"
				size="sm"
				:aria-label="`${progressPercent}% van de taken is klaar`" />

			<div class="grid gap-3 lg:grid-cols-2">
				<UCard>
					<template #header>
						<CSectionHeading
							size="sm"
							title="Deze week"
							description="Bezig of gepland voor deze week" />
					</template>
					<CTaskList
						:tasks="dashboard.thisWeek"
						empty="Niets gepland deze week." />
				</UCard>

				<UCard>
					<template #header>
						<CSectionHeading
							size="sm"
							title="Aandacht nodig" />
					</template>
					<div class="space-y-4">
						<div>
							<p class="text-error mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
								<UIcon
									name="i-lucide-alarm-clock"
									class="size-3.5" />
								Te laat
							</p>
							<CTaskList
								:tasks="dashboard.overdue"
								empty="Niets te laat 🎉" />
						</div>
						<div v-if="dashboard.blocked.length">
							<p class="text-warning mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
								<UIcon
									name="i-lucide-link"
									class="size-3.5" />
								Wacht op een andere taak
							</p>
							<CTaskList
								:tasks="dashboard.blocked"
								empty="" />
						</div>
					</div>
				</UCard>

				<UCard v-if="dashboard.budget">
					<template #header>
						<CSectionHeading
							size="sm"
							title="Budget per werkpost">
							<template #actions>
								<UButton
									to="/budget"
									label="Details"
									trailingIcon="i-lucide-arrow-right"
									color="neutral"
									variant="link"
									size="sm" />
							</template>
						</CSectionHeading>
					</template>
					<CCategoryBudgetBars :categories="dashboard.budget.categories" />
				</UCard>

				<UCard>
					<template #header>
						<CSectionHeading
							size="sm"
							title="Recente bestanden" />
					</template>
					<ul
						v-if="dashboard.recentFiles.length"
						class="divide-default divide-y">
						<li
							v-for="file in dashboard.recentFiles"
							:key="file.id">
							<a
								:href="driveContentUrl(file.driveFileId)"
								target="_blank"
								rel="noopener"
								class="flex items-center gap-3 py-2">
								<CFileThumb
									:fileId="file.driveFileId"
									:mimeType="file.mimeType"
									class="size-9" />
								<span class="min-w-0 flex-1">
									<span class="text-highlighted block truncate text-sm font-medium">{{ file.name }}</span>
									<span class="text-muted text-xs">{{ formatDateTime(file.createdAt) }}</span>
								</span>
							</a>
						</li>
					</ul>
					<p
						v-else
						class="text-muted text-sm">
						Nog geen bestanden gekoppeld aan taken, offertes of facturen.
					</p>
				</UCard>
			</div>
		</template>
	</CPage>
</template>

<script setup lang="ts">
	const { user } = useUserSession();
	const internal = computed(() => isInternal(user.value));

	const { data: dashboard } = await useFetch<DashboardView>('/api/dashboard', { key: 'dashboard' });

	const totalCount = computed(() =>
		dashboard.value ? Object.values(dashboard.value.taskCounts).reduce((sum, count) => sum + count, 0) : 0
	);
	const openCount = computed(() => totalCount.value - (dashboard.value?.taskCounts.done ?? 0));
	const progressPercent = computed(() =>
		totalCount.value ? Math.round(((dashboard.value?.taskCounts.done ?? 0) / totalCount.value) * 100) : 0
	);
</script>

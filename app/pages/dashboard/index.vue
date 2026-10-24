<template>
	<UContainer>
		<div class="flex items-center justify-between py-4">
			<UPageHeader
				title="Form Submissions"
				description="Overview of all form submissions" />

			<div class="flex items-center gap-3">
				<span v-if="user">
					{{ user.email }}
				</span>

				<UButton
					icon="i-lucide-log-out"
					color="neutral"
					variant="outline"
					label="Logout"
					@click="onLogout" />
			</div>
		</div>

		<div class="flex items-center justify-between gap-3 py-4">
			<UInput
				v-model="globalFilter"
				placeholder="Search..."
				icon="i-lucide-search" />

			<div class="flex items-center gap-2">
				<UDropdownMenu :items="downloadItems">
					<UButton
						icon="i-lucide-download"
						color="neutral"
						variant="outline"
						label="Download" />
				</UDropdownMenu>

				<UDropdownMenu :items="columnToggleItems">
					<UButton
						icon="i-lucide-settings-2"
						color="neutral"
						variant="outline"
						label="View" />
				</UDropdownMenu>
			</div>
		</div>

		<UTable
			ref="tableRef"
			v-model:globalFilter="globalFilter"
			v-model:columnVisibility="columnVisibility"
			v-model:sorting="sorting"
			:data="submissions || []"
			:columns="columns"
			:loading="status === 'pending'" />
	</UContainer>
</template>

<script setup lang="ts">
	import type { TableColumn } from '@nuxt/ui';
	import type { Column } from '@tanstack/vue-table';
	import { h } from 'vue';
	import * as XLSX from 'xlsx';

	defineI18nRoute(false);

	definePageMeta({
		layout: 'dashboard',
		middleware: 'auth'
	});

	const { user, clear: logout } = useUserSession();
	const toast = useToast();

	async function onLogout() {
		await $fetch('/api/auth/logout', { method: 'POST' });
		await logout();

		toast.add({
			title: 'Logged out',
			description: 'You have been logged out.',
			color: 'success'
		});

		await navigateTo('/dashboard/login');
	}

	type Submission = {
		id: number;
		firstName: string;
		lastName: string;
		email: string;
		createdAt: string;
	};

	const { data: submissions, status } = await useFetch<Submission[]>('/api/form/submissions');

	const tableRef = ref();
	const globalFilter = ref('');
	const columnVisibility = ref<Record<string, boolean>>({});
	const sorting = ref([]);

	function getSortableHeader(column: Column<Submission, unknown>, label: string) {
		const isSorted = column.getIsSorted();
		return h(resolveComponent('UButton'), {
			color: 'neutral',
			variant: 'ghost',
			label,
			icon: isSorted
				? isSorted === 'asc'
					? 'i-lucide-arrow-up-narrow-wide'
					: 'i-lucide-arrow-down-wide-narrow'
				: 'i-lucide-arrow-up-down',
			onClick: () => column.toggleSorting()
		});
	}

	const columns: TableColumn<Submission>[] = [
		{
			accessorKey: 'id',
			header: ({ column }) => getSortableHeader(column, 'ID')
		},
		{
			accessorKey: 'firstName',
			header: ({ column }) => getSortableHeader(column, 'First Name')
		},
		{
			accessorKey: 'lastName',
			header: ({ column }) => getSortableHeader(column, 'Last Name')
		},
		{
			accessorKey: 'email',
			header: ({ column }) => getSortableHeader(column, 'Email')
		},
		{
			accessorKey: 'createdAt',
			header: ({ column }) => getSortableHeader(column, 'Date'),
			cell: ({ row }) => {
				const date = new Date(row.original.createdAt);
				return h(
					'span',
					date.toLocaleDateString('nl-BE', {
						year: 'numeric',
						month: 'short',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
					})
				);
			}
		}
	];

	const columnToggleItems = computed(() => {
		if (!tableRef.value?.tableApi) return [];

		return tableRef.value.tableApi
			.getAllColumns()
			.filter((column: Column<Submission, unknown>) => column.getCanHide())
			.map((column: Column<Submission, unknown>) => ({
				label: column.id,
				type: 'checkbox' as const,
				checked: column.getIsVisible(),
				onUpdateChecked: (checked: boolean) => column.toggleVisibility(checked),
				onSelect: (e: Event) => e.preventDefault()
			}));
	});

	function getExportData() {
		return (submissions.value || []).map((s) => ({
			ID: s.id,
			'First Name': s.firstName,
			'Last Name': s.lastName,
			Email: s.email,
			Date: new Date(s.createdAt).toLocaleDateString('nl-BE', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})
		}));
	}

	function downloadCSV() {
		const data = getExportData();
		if (data.length === 0) {
			toast.add({
				title: 'No data',
				description: 'There are no submissions to export.',
				color: 'warning'
			});
			return;
		}

		const worksheet = XLSX.utils.json_to_sheet(data);
		const csv = XLSX.utils.sheet_to_csv(worksheet);
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `form-submissions-${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
		URL.revokeObjectURL(url);

		toast.add({
			title: 'Downloaded',
			description: 'CSV file has been downloaded.',
			color: 'success'
		});
	}

	function downloadExcel() {
		const data = getExportData();
		if (data.length === 0) {
			toast.add({
				title: 'No data',
				description: 'There are no submissions to export.',
				color: 'warning'
			});
			return;
		}

		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
		XLSX.writeFile(workbook, `form-submissions-${new Date().toISOString().split('T')[0]}.xlsx`);

		toast.add({
			title: 'Downloaded',
			description: 'Excel file has been downloaded.',
			color: 'success'
		});
	}

	const downloadItems = [
		{
			label: 'Download as CSV',
			icon: 'i-lucide-file-text',
			onSelect: () => downloadCSV()
		},
		{
			label: 'Download as Excel',
			icon: 'i-lucide-file-spreadsheet',
			onSelect: () => downloadExcel()
		}
	];
</script>

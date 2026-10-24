<template>
	<UContainer>
		<div class="flex items-center justify-between py-4">
			<UPageHeader
				title="User Management"
				description="Manage users and their roles" />

			<UButton
				icon="i-lucide-plus"
				label="Add User"
				@click="isAddModalOpen = true" />
		</div>

		<div class="flex items-center gap-3 py-4">
			<UInput
				v-model="globalFilter"
				placeholder="Search..."
				icon="i-lucide-search" />
		</div>

		<UTable
			ref="tableRef"
			v-model:globalFilter="globalFilter"
			v-model:sorting="sorting"
			:data="users || []"
			:columns="columns"
			:loading="status === 'pending'" />

		<UModal v-model:open="isAddModalOpen">
			<template #content>
				<UCard>
					<template #header>
						<h3 class="text-lg font-semibold">Add New User</h3>
					</template>

					<UForm
						:state="formState"
						:schema="formSchema"
						class="space-y-4"
						@submit="onAddUser">
						<UFormField
							name="email"
							label="Email"
							required>
							<UInput
								v-model="formState.email"
								type="email"
								placeholder="user@example.com" />
						</UFormField>

						<UFormField
							name="name"
							label="Name">
							<UInput
								v-model="formState.name"
								placeholder="John Doe" />
						</UFormField>

						<UFormField
							name="password"
							label="Password"
							required>
							<UInput
								v-model="formState.password"
								type="password"
								placeholder="Min 8 characters" />
						</UFormField>

						<UFormField
							name="role"
							label="Role"
							required>
							<USelect
								v-model="formState.role"
								:items="roleOptions"
								placeholder="Select role" />
						</UFormField>

						<div class="flex justify-end gap-2 pt-4">
							<UButton
								color="neutral"
								variant="outline"
								label="Cancel"
								@click="isAddModalOpen = false" />
							<UButton
								type="submit"
								:loading="isSubmitting"
								label="Add User" />
						</div>
					</UForm>
				</UCard>
			</template>
		</UModal>

		<UModal v-model:open="isEditModalOpen">
			<template #content>
				<UCard>
					<template #header>
						<h3 class="text-lg font-semibold">Edit User</h3>
					</template>

					<UForm
						:state="editFormState"
						:schema="editFormSchema"
						class="space-y-4"
						@submit="onEditUser">
						<UFormField
							name="email"
							label="Email"
							required>
							<UInput
								v-model="editFormState.email"
								type="email"
								placeholder="user@example.com" />
						</UFormField>

						<UFormField
							name="name"
							label="Name">
							<UInput
								v-model="editFormState.name"
								placeholder="John Doe" />
						</UFormField>

						<UFormField
							name="password"
							label="New Password"
							hint="Leave empty to keep current">
							<UInput
								v-model="editFormState.password"
								type="password"
								placeholder="Min 8 characters" />
						</UFormField>

						<UFormField
							name="role"
							label="Role"
							description="Admin can view form submissions. Super Admin has full access including user management."
							required>
							<USelect
								v-model="editFormState.role"
								:items="roleOptions"
								placeholder="Select role" />
						</UFormField>

						<div class="flex justify-end gap-2 pt-4">
							<UButton
								color="neutral"
								variant="outline"
								label="Cancel"
								@click="isEditModalOpen = false" />
							<UButton
								type="submit"
								:loading="isEditing"
								label="Save Changes" />
						</div>
					</UForm>
				</UCard>
			</template>
		</UModal>

		<UModal v-model:open="isDeleteModalOpen">
			<template #content>
				<UCard>
					<template #header>
						<h3 class="text-lg font-semibold">Delete User</h3>
					</template>

					<p>
						Are you sure you want to delete <strong>{{ userToDelete?.email }}</strong
						>?
					</p>
					<p class="text-muted mt-2 text-sm">This action cannot be undone.</p>

					<div class="flex justify-end gap-2 pt-4">
						<UButton
							color="neutral"
							variant="outline"
							label="Cancel"
							@click="isDeleteModalOpen = false" />
						<UButton
							color="error"
							:loading="isDeleting"
							label="Delete"
							@click="onDeleteUser" />
					</div>
				</UCard>
			</template>
		</UModal>

		<UModal v-model:open="isResetPasswordModalOpen">
			<template #content>
				<UCard>
					<template #header>
						<h3 class="text-lg font-semibold">Reset Password</h3>
					</template>

					<template v-if="!newPassword">
						<p>
							Generate a new password for <strong>{{ userToResetPassword?.email }}</strong
							>?
						</p>
						<p class="text-muted mt-2 text-sm">The current password will be replaced.</p>

						<div class="flex justify-end gap-2 pt-4">
							<UButton
								color="neutral"
								variant="outline"
								label="Cancel"
								@click="closeResetPasswordModal" />
							<UButton
								:loading="isResettingPassword"
								label="Generate Password"
								@click="onResetPassword" />
						</div>
					</template>

					<template v-else>
						<p class="mb-4">
							New password for <strong>{{ userToResetPassword?.email }}</strong
							>:
						</p>

						<div class="flex items-center gap-2">
							<UInput
								:modelValue="newPassword"
								readonly
								class="flex-1 font-mono" />
							<UButton
								icon="i-lucide-copy"
								color="neutral"
								variant="outline"
								@click="copyPassword" />
						</div>

						<UAlert
							icon="i-lucide-info"
							color="warning"
							title="Important"
							description="Save this password now. It cannot be retrieved again."
							class="mt-4" />

						<div class="flex justify-end gap-2 pt-4">
							<UButton
								label="Done"
								@click="closeResetPasswordModal" />
						</div>
					</template>
				</UCard>
			</template>
		</UModal>
	</UContainer>
</template>

<script setup lang="ts">
	import type { TableColumn } from '@nuxt/ui';
	import type { Column } from '@tanstack/vue-table';
	import { h } from 'vue';
	import { z } from 'zod';

	defineI18nRoute(false);

	definePageMeta({
		layout: 'dashboard',
		middleware: 'superadmin'
	});

	useZodLocale();

	const toast = useToast();

	type User = {
		id: string;
		email: string;
		name: string | null;
		role: 'admin' | 'superadmin';
		createdAt: string;
	};

	const { data: users, status, refresh } = await useFetch<User[]>('/api/users');

	const tableRef = ref();
	const globalFilter = ref('');
	const sorting = ref([]);

	const isAddModalOpen = ref(false);
	const isEditModalOpen = ref(false);
	const isDeleteModalOpen = ref(false);
	const isResetPasswordModalOpen = ref(false);
	const isSubmitting = ref(false);
	const isEditing = ref(false);
	const isDeleting = ref(false);
	const isResettingPassword = ref(false);
	const userToEdit = ref<User | null>(null);
	const userToDelete = ref<User | null>(null);
	const userToResetPassword = ref<User | null>(null);
	const newPassword = ref<string | null>(null);

	const roleOptions = [
		{ label: 'Admin', value: 'admin' },
		{ label: 'Super Admin', value: 'superadmin' }
	];

	const formSchema = z.object({
		email: z.string().email('Invalid email address'),
		name: z.string().optional(),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		role: z.enum(['admin', 'superadmin'])
	});

	const formState = reactive({
		email: '',
		name: '',
		password: '',
		role: 'admin' as 'admin' | 'superadmin'
	});

	function resetForm() {
		formState.email = '';
		formState.name = '';
		formState.password = '';
		formState.role = 'admin';
	}

	// Edit form
	const editFormSchema = z.object({
		email: z.string().email('Invalid email address'),
		name: z.string().optional(),
		password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
		role: z.enum(['admin', 'superadmin'])
	});

	const editFormState = reactive({
		email: '',
		name: '',
		password: '',
		role: 'admin' as 'admin' | 'superadmin'
	});

	function openEditModal(user: User) {
		userToEdit.value = user;
		editFormState.email = user.email;
		editFormState.name = user.name || '';
		editFormState.password = '';
		editFormState.role = user.role;
		isEditModalOpen.value = true;
	}

	async function onEditUser() {
		if (!userToEdit.value) return;

		isEditing.value = true;
		try {
			const body: Record<string, string> = {
				email: editFormState.email,
				name: editFormState.name,
				role: editFormState.role
			};

			if (editFormState.password) {
				body.password = editFormState.password;
			}

			await $fetch(`/api/users/${userToEdit.value.id}`, {
				method: 'PATCH',
				body
			});
			toast.add({
				title: 'User updated',
				description: `User ${editFormState.email} has been updated.`,
				color: 'success'
			});
			isEditModalOpen.value = false;
			userToEdit.value = null;
			await refresh();
		} catch (error: unknown) {
			const err = error as { data?: { message?: string } };
			toast.add({
				title: 'Error',
				description: err.data?.message || 'Failed to update user',
				color: 'error'
			});
		} finally {
			isEditing.value = false;
		}
	}

	async function onAddUser() {
		isSubmitting.value = true;
		try {
			await $fetch('/api/auth/register', {
				method: 'POST',
				body: formState
			});
			toast.add({
				title: 'User created',
				description: `User ${formState.email} has been created.`,
				color: 'success'
			});
			isAddModalOpen.value = false;
			resetForm();
			await refresh();
		} catch (error: unknown) {
			const err = error as { data?: { message?: string } };
			toast.add({
				title: 'Error',
				description: err.data?.message || 'Failed to create user',
				color: 'error'
			});
		} finally {
			isSubmitting.value = false;
		}
	}

	function confirmDelete(user: User) {
		userToDelete.value = user;
		isDeleteModalOpen.value = true;
	}

	async function onDeleteUser() {
		if (!userToDelete.value) return;

		isDeleting.value = true;
		try {
			await $fetch(`/api/users/${userToDelete.value.id}`, {
				method: 'DELETE'
			});
			toast.add({
				title: 'User deleted',
				description: `User ${userToDelete.value.email} has been deleted.`,
				color: 'success'
			});
			isDeleteModalOpen.value = false;
			userToDelete.value = null;
			await refresh();
		} catch (error: unknown) {
			const err = error as { data?: { message?: string } };
			toast.add({
				title: 'Error',
				description: err.data?.message || 'Failed to delete user',
				color: 'error'
			});
		} finally {
			isDeleting.value = false;
		}
	}

	// Reset password
	function openResetPasswordModal(user: User) {
		userToResetPassword.value = user;
		newPassword.value = null;
		isResetPasswordModalOpen.value = true;
	}

	function closeResetPasswordModal() {
		isResetPasswordModalOpen.value = false;
		userToResetPassword.value = null;
		newPassword.value = null;
	}

	async function onResetPassword() {
		if (!userToResetPassword.value) return;

		isResettingPassword.value = true;
		try {
			const result = await $fetch<{ password: string }>(`/api/users/${userToResetPassword.value.id}/reset-password`, {
				method: 'POST'
			});
			newPassword.value = result.password;
			toast.add({
				title: 'Password reset',
				description: 'A new password has been generated.',
				color: 'success'
			});
		} catch (error: unknown) {
			const err = error as { data?: { message?: string } };
			toast.add({
				title: 'Error',
				description: err.data?.message || 'Failed to reset password',
				color: 'error'
			});
		} finally {
			isResettingPassword.value = false;
		}
	}

	async function copyPassword() {
		if (!newPassword.value) return;

		try {
			await navigator.clipboard.writeText(newPassword.value);
			toast.add({
				title: 'Copied',
				description: 'Password copied to clipboard.',
				color: 'success'
			});
		} catch {
			toast.add({
				title: 'Error',
				description: 'Failed to copy password.',
				color: 'error'
			});
		}
	}

	function getSortableHeader(column: Column<User, unknown>, label: string) {
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

	const columns: TableColumn<User>[] = [
		{
			accessorKey: 'id',
			header: ({ column }) => getSortableHeader(column, 'ID')
		},
		{
			accessorKey: 'email',
			header: ({ column }) => getSortableHeader(column, 'Email')
		},
		{
			accessorKey: 'name',
			header: ({ column }) => getSortableHeader(column, 'Name'),
			cell: ({ row }) => h('span', row.original.name || '-')
		},
		{
			accessorKey: 'role',
			header: ({ column }) => getSortableHeader(column, 'Role'),
			cell: ({ row }) =>
				h(resolveComponent('UBadge'), {
					color: row.original.role === 'superadmin' ? 'primary' : 'neutral',
					variant: 'subtle',
					label: row.original.role === 'superadmin' ? 'Super Admin' : 'Admin'
				})
		},
		{
			accessorKey: 'createdAt',
			header: ({ column }) => getSortableHeader(column, 'Created'),
			cell: ({ row }) => {
				const date = new Date(row.original.createdAt);
				return h(
					'span',
					date.toLocaleDateString('nl-BE', {
						year: 'numeric',
						month: 'short',
						day: 'numeric'
					})
				);
			}
		},
		{
			id: 'actions',
			header: '',
			cell: ({ row }) =>
				h('div', { class: 'flex gap-1' }, [
					h(resolveComponent('UButton'), {
						icon: 'i-lucide-pencil',
						color: 'neutral',
						variant: 'ghost',
						size: 'sm',
						onClick: () => openEditModal(row.original)
					}),
					h(resolveComponent('UButton'), {
						icon: 'i-lucide-key-round',
						color: 'neutral',
						variant: 'ghost',
						size: 'sm',
						onClick: () => openResetPasswordModal(row.original)
					}),
					h(resolveComponent('UButton'), {
						icon: 'i-lucide-trash-2',
						color: 'error',
						variant: 'ghost',
						size: 'sm',
						onClick: () => confirmDelete(row.original)
					})
				])
		}
	];
</script>

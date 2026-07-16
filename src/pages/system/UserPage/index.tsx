import {
	createColumnHelper,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaTrash, FaUser } from 'react-icons/fa';
import { Badge, Button, buttonProps, DataTable, PageHeader, Panel } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import DeleteUserModal from '@/pages/system/UserPage/components/DeleteUserModal';
import UserFormModal from '@/pages/system/UserPage/components/UserFormModal';
import { useUserListQuery } from '@/services/user/user.queries';
import type { User } from '@/services/user/user.types';

const columnHelper = createColumnHelper<User>();

export default function UserPage() {
	const { canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const usernameFilter = columnFilters.find((f) => f.id === 'username')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useUserListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: usernameFilter || undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		columnHelper.accessor('avatar', {
			header: 'Avatar',
			size: 70,
			enableSorting: false,
			enableColumnFilter: false,
			cell: (info) => {
				const avatar = info.getValue();
				return (
					<div className='flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-ca-border bg-ca-silver'>
						{avatar ? (
							<img src={avatar} alt='Avatar' className='h-full w-full object-cover' />
						) : (
							<FaUser className='text-sm text-ca-text' />
						)}
					</div>
				);
			},
		}),
		columnHelper.accessor('username', { header: 'Login', meta: { align: 'left' } }),
		columnHelper.display({
			id: 'full_name',
			header: 'F.I.Sh',
			meta: { align: 'left' },
			enableColumnFilter: false,
			cell: ({ row }) => `${row.original.last_name} ${row.original.first_name}`.trim(),
		}),
		columnHelper.accessor('phone_number', { header: 'Telefon', size: 160, enableColumnFilter: false }),
		columnHelper.accessor('email', { header: 'Email', enableColumnFilter: false }),
		columnHelper.accessor('is_active', {
			header: 'Holati',
			size: 100,
			enableColumnFilter: false,
			cell: (info) => <Badge variant={info.getValue() ? 'success' : 'danger'}>{info.getValue() ? 'Faol' : 'Nofaol'}</Badge>,
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableSorting: false,
			enableColumnFilter: false,
			size: 150,
			cell: ({ row }) => (
				<div className='flex justify-end gap-1'>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(<FaEdit />, 'warning', 'icon'),
							'aria-label': 'Tahrirlash',
							disabled: !canWrite,
						}}
						dialog={UserFormModal}
						dialogProps={{ mode: 'edit' as const, item: row.original }}
					/>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(<FaTrash />, 'danger', 'icon'),
							'aria-label': "O'chirish",
							disabled: !canWrite,
						}}
						dialog={DeleteUserModal}
						dialogProps={{ item: row.original }}
					/>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Foydalanuvchilar'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Foydalanuvchilar', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
							dialog={UserFormModal}
							dialogProps={{ mode: 'create' as const }}
						/>
					)
				}
				onReload={() => {
					refetch();
				}}
			>
				<DataTable
					columns={columns}
					data={results}
					manualPagination
					manualSorting
					manualFiltering
					pageCount={paginationMeta?.lastPage ?? -1}
					totalRows={paginationMeta?.total}
					pagination={pagination}
					onPaginationChange={setPagination}
					sorting={sorting}
					onSortingChange={setSorting}
					columnFilters={columnFilters}
					onColumnFiltersChange={setColumnFilters}
					enablePagination
					enableGlobalFilter={false}
					enableColumnFilters
					enableColumnVisibility
					enableSorting
					enableStriping
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>
		</>
	);
}

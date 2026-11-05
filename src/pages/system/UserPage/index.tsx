import {
	createColumnHelper,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useState, type ReactNode } from 'react';
import { FaCheck, FaClock, FaEdit, FaExclamationTriangle, FaFileInvoiceDollar, FaLock, FaTelegramPlane, FaTrash, FaUnlock, FaUser, FaUsers } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Badge, Button, buttonProps, buttonVariants, DataTable, Panel, Tooltip } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import DeleteUserModal from '@/pages/system/UserPage/components/DeleteUserModal';
import SalaryHistoryModal from '@/pages/system/UserPage/components/SalaryHistoryModal';
import { fmtDollar, fmtSom } from '@/pages/system/UserPayrollPage/utils';
import TelegramBotRegisterModal from '@/pages/system/UserPage/components/TelegramBotRegisterModal';
import UnblockUserModal from '@/pages/system/UserPage/components/UnblockUserModal';
import UserFormModal from '@/pages/system/UserPage/components/UserFormModal';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import { useUserListQuery } from '@/services/user/user.queries';
import { getUserTypeSkladIds, USER_TYPE_OPTIONS, type User } from '@/services/user/user.types';

const columnHelper = createColumnHelper<User>();

const SUMMARY_TONES = {
	green: 'bg-emerald-500/15 text-emerald-500',
	teal: 'bg-teal-500/15 text-teal-500',
	amber: 'bg-amber-500/15 text-amber-500',
	red: 'bg-red-500/15 text-red-500',
};

function PayrollSummaryCard({
	icon,
	label,
	value,
	tone,
}: {
	icon: ReactNode;
	label: string;
	value: number | undefined;
	tone: keyof typeof SUMMARY_TONES;
}) {
	return (
		<div className='flex items-center gap-4 rounded-lg border border-ca-border bg-ca-silver-light px-4 py-3'>
			<span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg', SUMMARY_TONES[tone])}>
				{icon}
			</span>
			<div className='min-w-0'>
				<div className='truncate text-xs text-ca-heading'>{label}</div>
				<div className='text-xl font-bold text-ca-heading'>{value ?? '—'}</div>
			</div>
		</div>
	);
}

export default function UserPage() {
	const { canWrite, isAdminOrManager } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [unblockTarget, setUnblockTarget] = useState<User | null>(null);
	const [telegramTarget, setTelegramTarget] = useState<User | null>(null);
	const [salaryTarget, setSalaryTarget] = useState<User | null>(null);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const usernameFilter = columnFilters.find((f) => f.id === 'username')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, error, refetch } = useUserListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: usernameFilter || undefined,
		ordering,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;
	const payrollSummary = data?.payroll_summary;

	const { data: skladTypeData } = useSkladTypeListQuery({ limit: 100 });
	const skladTypeNameById = new Map((skladTypeData?.results ?? []).map((t) => [t.id, t.name]));
	const userTypeSkladNames = (user: User) => {
		const detailNames = new Map((user.type_sklads_detail ?? []).map((t) => [t.id, t.name]));
		(user.type_sklads ?? []).forEach((t) => typeof t !== 'number' && detailNames.set(t.id, t.name));
		return getUserTypeSkladIds(user)
			.map((id) => detailNames.get(id) ?? skladTypeNameById.get(id) ?? `#${id}`)
			.join(', ');
	};

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
		columnHelper.accessor((row) => row.roles?.name ?? '', {
			id: 'role',
			header: 'Rol',
			enableColumnFilter: false,
			cell: (info) => info.getValue() || '—',
		}),
		columnHelper.accessor((row) => USER_TYPE_OPTIONS.find((o) => o.value === String(row.type))?.label ?? '', {
			id: 'type',
			header: 'Turi',
			enableColumnFilter: false,
			cell: (info) => info.getValue() || '—',
		}),
		columnHelper.accessor((row) => (row.companies_detail ?? []).map((c) => c.name).join(', '), {
			id: 'companies',
			header: 'Tashkilot',
			meta: { align: 'left' },
			enableColumnFilter: false,
			cell: (info) => info.getValue() || '—',
		}),
		columnHelper.accessor((row) => row.trade_company_detail?.name ?? '', {
			id: 'trade_company',
			header: 'Asosiy tashkilot',
			meta: { align: 'left' },
			enableColumnFilter: false,
			cell: (info) => info.getValue() || '—',
		}),
		columnHelper.accessor((row) => userTypeSkladNames(row), {
			id: 'type_sklads',
			header: 'Sklad turi',
			meta: { align: 'left' },
			enableSorting: false,
			enableColumnFilter: false,
			cell: (info) => info.getValue() || '—',
		}),
		columnHelper.display({
			id: 'salary',
			header: 'Ish haqi',
			meta: { align: 'left' },
			enableColumnFilter: false,
			cell: ({ row }) => (
				<button
					type='button'
					title="Ish haqi o'zgarishlar tarixi"
					onClick={() => setSalaryTarget(row.original)}
					className='text-left font-semibold whitespace-nowrap text-ca-theme hover:underline'
				>
					{fmtDollar(row.original.oylik_dollar)} / {fmtSom(row.original.oylik_som)}
				</button>
			),
		}),
		columnHelper.accessor('is_active', {
			header: 'Holati',
			size: 100,
			enableColumnFilter: false,
			cell: (info) => (
				<Badge variant={info.getValue() ? 'success' : 'danger'}>{info.getValue() ? 'Faol' : 'Nofaol'}</Badge>
			),
		}),
		columnHelper.accessor('is_send_bot', {
			header: 'Bot xabarnoma',
			size: 120,
			enableColumnFilter: false,
			cell: (info) => (
				<Badge variant={info.getValue() ? 'success' : 'default'}>{info.getValue() ? 'Ha' : "Yo'q"}</Badge>
			),
		}),
		columnHelper.accessor('is_login_blocked', {
			header: 'Bloklangan',
			size: 110,
			enableColumnFilter: false,
			cell: (info) => (
				<Badge variant={info.getValue() ? 'danger' : 'default'}>{info.getValue() ? 'Ha' : "Yo'q"}</Badge>
			),
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableSorting: false,
			enableColumnFilter: false,
			size: 220,
			cell: ({ row }) => (
				<div className='flex items-center justify-end gap-1'>
					<Tooltip content="Oylik to'lovlar tarixi">
						<Link
							to={`/system/users/${row.original.id}/payroll`}
							aria-label="Oylik to'lovlar tarixi"
							className={buttonVariants({ variant: 'success', size: 'icon' })}
						>
							<FaFileInvoiceDollar />
						</Link>
					</Tooltip>
					{row.original.is_login_blocked && canWrite && (
						<Button
							type='button'
							variant='danger'
							size='icon'
							aria-label='Blokdan chiqarish'
							onClick={() => setUnblockTarget(row.original)}
						>
							<FaLock />
						</Button>
					)}
					{canWrite && (
						<Button
							type='button'
							variant='info'
							size='icon'
							aria-label="Telegram Botdan ro'yxatdan o'tkazish"
							onClick={() => setTelegramTarget(row.original)}
						>
							<FaTelegramPlane />
						</Button>
					)}
					{isAdminOrManager && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{
								...buttonProps(<FaEdit />, 'warning', 'icon'),
								'aria-label': 'Tahrirlash',
							}}
							dialog={UserFormModal}
							dialogProps={{ mode: 'edit' as const, item: row.original }}
						/>
					)}
					{canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{
								...buttonProps(<FaTrash />, 'danger', 'icon'),
								'aria-label': "O'chirish",
							}}
							dialog={DeleteUserModal}
							dialogProps={{ item: row.original }}
						/>
					)}
				</div>
			),
		}),
	];

	return (
		<>

			<Panel
				title="Ro'yxat"
				actions={
					isAdminOrManager && (
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
				{/* This month's salary status; the backend sends it with the user list. */}
				<div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
					<PayrollSummaryCard icon={<FaUsers />} label='Jami xodimlar' value={payrollSummary?.total_employees} tone='green' />
					<PayrollSummaryCard icon={<FaCheck />} label="To'liq to'langan" value={payrollSummary?.fully_paid} tone='teal' />
					<PayrollSummaryCard icon={<FaClock />} label="Qisman to'langan" value={payrollSummary?.partially_paid} tone='amber' />
					<PayrollSummaryCard
						icon={<FaExclamationTriangle />}
						label="To'lanmagan"
						value={payrollSummary?.unpaid}
						tone='red'
					/>
				</div>
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
					columnVisibilityKey='users'
					enableSorting
					enableStriping
					getRowClassName={(row) => (row.is_login_blocked ? 'bg-ca-orange/10' : undefined)}
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : "Ma'lumot topilmadi"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>

			{unblockTarget && (
				<UnblockUserModal
					open
					setOpen={(open) => {
						if (!open) setUnblockTarget(null);
					}}
					item={unblockTarget}
				/>
			)}

			{salaryTarget && (
				<SalaryHistoryModal
					open
					setOpen={(open) => {
						if (!open) setSalaryTarget(null);
					}}
					item={salaryTarget}
				/>
			)}

			{telegramTarget && (
				<TelegramBotRegisterModal
					open
					setOpen={(open) => {
						if (!open) setTelegramTarget(null);
					}}
					item={telegramTarget}
				/>
			)}
		</>
	);
}

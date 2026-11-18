import {
	createColumnHelper,
	type ColumnDef,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useState, type ReactNode } from 'react';
import {
	FaArchive,
	FaCheck,
	FaClock,
	FaEdit,
	FaExclamationTriangle,
	FaFileInvoiceDollar,
	FaLock,
	FaTelegramPlane,
	FaTrash,
	FaUndoAlt,
	FaUser,
	FaUsers,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Badge, Button, buttonProps, buttonVariants, DataTable, Panel, Tooltip } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { formatDate } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/errors';
import { usePermissions } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import SalaryHistoryModal from '@/pages/system/UserPage/components/SalaryHistoryModal';
import TelegramBotRegisterModal from '@/pages/system/UserPage/components/TelegramBotRegisterModal';
import UnblockUserModal from '@/pages/system/UserPage/components/UnblockUserModal';
import UserFormModal from '@/pages/system/UserPage/components/UserFormModal';
import UserStatusModal, { type UserStatusAction } from '@/pages/system/UserPage/components/UserStatusModal';
import { USER_TAB_CONFIG, type UserTab } from '@/pages/system/UserPage/userTabs';
import { fmtDollar, fmtSom } from '@/pages/system/UserPayrollPage/utils';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import { useUserListQuery } from '@/services/user/user.queries';
import { getUserTypeSkladIds, isSystemUser, USER_TYPE_LABELS, type User } from '@/services/user/user.types';

const columnHelper = createColumnHelper<User>();

/** Text filters typed into these columns go to the backend's `search` (name, login, role, sklad type). */
const SEARCH_COLUMN_IDS = ['username', 'last_name'];

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

function fullName(user: User) {
	return [user.last_name, user.first_name, user.second_name].filter(Boolean).join(' ');
}

/** One tab of the "Hodimlar" page: its own list request, columns and actions. */
export default function UserListTab({ tab }: { tab: UserTab }) {
	const config = USER_TAB_CONFIG[tab];
	const isSystemTab = tab === 'system';
	const isArchiveTab = tab === 'archive';
	const { canWrite } = useCurrentCompany();
	const { currentUserId, canManageSystemUsers, canManageStoreEmployees, canManageSkladEmployees, canViewUserArchive } =
		usePermissions();
	// Whoever sees a tab manages it: add / edit / archive, or restore / delete in the archive.
	const canManage = {
		system: canManageSystemUsers,
		store: canManageStoreEmployees,
		sklad: canManageSkladEmployees,
		archive: canViewUserArchive,
	}[tab];

	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [unblockTarget, setUnblockTarget] = useState<User | null>(null);
	const [telegramTarget, setTelegramTarget] = useState<User | null>(null);
	const [salaryTarget, setSalaryTarget] = useState<User | null>(null);
	const [statusTarget, setStatusTarget] = useState<{ item: User; action: UserStatusAction } | null>(null);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const search = columnFilters.find((f) => SEARCH_COLUMN_IDS.includes(f.id))?.value as string | undefined;

	const { data, isLoading, isFetching, isError, error, refetch } = useUserListQuery({
		...config.params,
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: search || undefined,
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

	const iconButton = (label: string, icon: ReactNode, variant: 'warning' | 'danger' | 'success' | 'info', onClick: () => void) => (
		<Tooltip content={label}>
			<Button type='button' variant={variant} size='icon' aria-label={label} onClick={onClick}>
				{icon}
			</Button>
		</Tooltip>
	);

	const renderActions = (user: User) => {
		const isSelf = user.id === currentUserId;
		return (
			<div className='flex items-center justify-end gap-1'>
				<Tooltip content="Oylik to'lovlar tarixi">
					<Link
						to={`/system/users/${user.id}/payroll`}
						aria-label="Oylik to'lovlar tarixi"
						className={buttonVariants({ variant: 'success', size: 'icon' })}
					>
						<FaFileInvoiceDollar />
					</Link>
				</Tooltip>
				{isArchiveTab ? (
					<>
						{canManage &&
							canWrite &&
							iconButton('Arxivdan tiklash', <FaUndoAlt />, 'success', () =>
								setStatusTarget({ item: user, action: 'restore' }),
							)}
						{canManage &&
							canWrite &&
							!isSelf &&
							iconButton("Butunlay o'chirish", <FaTrash />, 'danger', () =>
								setStatusTarget({ item: user, action: 'delete' }),
							)}
					</>
				) : (
					<>
						{isSystemTab &&
							user.is_login_blocked &&
							canManage &&
							canWrite &&
							iconButton('Blokdan chiqarish', <FaLock />, 'danger', () => setUnblockTarget(user))}
						{isSystemTab &&
							canManage &&
							canWrite &&
							iconButton("Telegram Botdan ro'yxatdan o'tkazish", <FaTelegramPlane />, 'info', () =>
								setTelegramTarget(user),
							)}
						{canManage && (
							<OpenDialogButton
								element={(props) => <Button {...props} />}
								elementProps={{ ...buttonProps(<FaEdit />, 'warning', 'icon'), 'aria-label': 'Tahrirlash' }}
								dialog={UserFormModal}
								dialogProps={{ mode: 'edit' as const, item: user }}
							/>
						)}
						{canManage &&
							canWrite &&
							!isSelf &&
							iconButton("Arxivga o'tkazish", <FaArchive />, 'danger', () =>
								setStatusTarget({ item: user, action: 'archive' }),
							)}
					</>
				)}
			</div>
		);
	};

	const avatarColumn = columnHelper.accessor('avatar', {
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
	});
	const loginColumn = columnHelper.accessor('username', {
		header: 'Login',
		meta: { align: 'left' },
		// Tab 1 searches by login; the other tabs search from the name column.
		enableColumnFilter: isSystemTab,
		// Account-only employees get a generated login nobody uses.
		cell: ({ row, getValue }) => (isSystemUser(row.original) ? getValue() : '—'),
	});
	// Sorted by last name; its filter searches names and logins.
	const nameColumn = columnHelper.accessor((row) => fullName(row), {
		id: 'last_name',
		header: 'F.I.Sh',
		meta: { align: 'left' },
		enableColumnFilter: !isSystemTab,
		cell: (info) => info.getValue() || '—',
	});
	const phoneColumn = columnHelper.accessor('phone_number', { header: 'Telefon', size: 160, enableColumnFilter: false });
	const salaryColumn = columnHelper.display({
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
	});
	const actionsColumn = columnHelper.display({
		id: 'actions',
		header: 'Harakatlar',
		meta: { align: 'right' },
		enableSorting: false,
		enableColumnFilter: false,
		size: isSystemTab ? 220 : 150,
		cell: ({ row }) => renderActions(row.original),
	});

	const systemColumns = [
		columnHelper.accessor('email', { header: 'Email', enableColumnFilter: false }),
		columnHelper.accessor((row) => row.roles?.name ?? '', {
			id: 'role',
			header: 'Rol',
			enableColumnFilter: false,
			cell: (info) => info.getValue() || '—',
		}),
		columnHelper.accessor((row) => (row.type != null ? (USER_TYPE_LABELS[row.type] ?? row.type_name ?? '') : ''), {
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
	];
	const systemStatusColumns = [
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
	];
	const employeeColumns = [
		columnHelper.accessor('date_of_birthday', {
			header: "Tug'ilgan sana",
			size: 120,
			enableColumnFilter: false,
			cell: (info) => formatDate(info.getValue(), '—'),
		}),
		columnHelper.accessor('address', {
			header: 'Manzil',
			meta: { align: 'left' },
			enableSorting: false,
			enableColumnFilter: false,
			cell: (info) => info.getValue() || '—',
		}),
	];
	// The archive mixes system users and employees, so it says which one each row was.
	const archiveKindColumn = columnHelper.accessor(
		(row) => (isSystemUser(row) ? (row.roles?.name ?? 'Tizim foydalanuvchisi') : (row.type_name ?? USER_TYPE_LABELS[row.type ?? 0] ?? '')),
		{
			id: 'type',
			header: 'Turi / Rol',
			enableColumnFilter: false,
			cell: (info) => info.getValue() || '—',
		},
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const columns: ColumnDef<User, any>[] = isSystemTab
		? [avatarColumn, loginColumn, nameColumn, phoneColumn, ...systemColumns, salaryColumn, ...systemStatusColumns, actionsColumn]
		: isArchiveTab
			? [avatarColumn, loginColumn, nameColumn, phoneColumn, archiveKindColumn, salaryColumn, actionsColumn]
			: [avatarColumn, nameColumn, phoneColumn, ...employeeColumns, salaryColumn, actionsColumn];

	return (
		<>
			<Panel
				title="Ro'yxat"
				actions={
					canManage &&
					!isArchiveTab && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
							dialog={UserFormModal}
							dialogProps={{ mode: 'create' as const, employeeType: config.employeeType }}
						/>
					)
				}
				onReload={() => {
					refetch();
				}}
			>
				{/* This month's salary status of this tab's users; the backend sends it with the list. */}
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
					onColumnFiltersChange={(filters) => {
						setColumnFilters(filters);
						// A new search is a different list: start it from the first page.
						setPagination((p) => ({ ...p, pageIndex: 0 }));
					}}
					enablePagination
					enableGlobalFilter={false}
					enableColumnFilters
					enableColumnVisibility
					// Tab 1 keeps the old key, so saved column choices and links still apply.
					columnVisibilityKey={isSystemTab ? 'users' : `users-${tab}`}
					enableSorting
					enableStriping
					getRowClassName={(row) => (isSystemTab && row.is_login_blocked ? 'bg-ca-orange/10' : undefined)}
					isLoading={isLoading || isFetching}
					emptyMessage={
						isError
							? getApiErrorMessage(error, 'Xatolik yuz berdi')
							: isArchiveTab
								? "Arxivda hodim yo'q"
								: "Ma'lumot topilmadi"
					}
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

			{statusTarget && (
				<UserStatusModal
					open
					setOpen={(open) => {
						if (!open) setStatusTarget(null);
					}}
					item={statusTarget.item}
					action={statusTarget.action}
				/>
			)}
		</>
	);
}

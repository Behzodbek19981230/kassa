import { createColumnHelper, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaEye, FaExclamationTriangle } from 'react-icons/fa';
import {
	Badge,
	Button,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	DatePicker,
	PageHeader,
	Panel,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { useCompanyEventLogListQuery } from '@/services/company-event-log/company-event-log.queries';
import type { CompanyEventLogItem } from '@/services/company-event-log/company-event-log.types';
import { userService } from '@/services/user/user.service';
import CompanyEventLogDetailModal from '@/pages/system/CompanyEventLogPage/components/CompanyEventLogDetailModal';

const columnHelper = createColumnHelper<CompanyEventLogItem>();

const ACTION_LABEL: Record<string, string> = { CREATE: 'Yaratildi', UPDATE: 'Yangilandi', DELETE: "O'chirildi" };
const ACTION_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
	CREATE: 'success',
	UPDATE: 'warning',
	DELETE: 'danger',
};

function formatDateTime(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	const date = d.toLocaleDateString('ru-RU');
	const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	return `${date} ${time}`;
}

export default function CompanyEventLogPage() {
	const { companyId, isSuperAdmin } = useCurrentCompany();

	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [detailId, setDetailId] = useState<number | null>(null);

	const actionFilter = columnFilters.find((f) => f.id === 'action')?.value as string | undefined;
	const eventTypeFilter = columnFilters.find((f) => f.id === 'event_type')?.value as string | undefined;
	const modelNameFilter = columnFilters.find((f) => f.id === 'model_name')?.value as string | undefined;
	const userFilter = columnFilters.find((f) => f.id === 'user_label')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, refetch } = useCompanyEventLogListQuery({
		company: companyId ?? undefined,
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		action: (actionFilter as CompanyEventLogItem['action']) || undefined,
		event_type: eventTypeFilter || undefined,
		model_name: modelNameFilter || undefined,
		user: userFilter ? Number(userFilter) : undefined,
		start_date: startDate ? `${startDate}T00:00:00` : undefined,
		end_date: endDate ? `${endDate}T23:59:59` : undefined,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const loadUserOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await userService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((u) => ({
				value: String(u.id),
				label: `${u.last_name} ${u.first_name}`.trim() || u.username,
			})),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const columns = [
		columnHelper.accessor('created_time', {
			header: 'Sana',
			size: 140,
			enableColumnFilter: false,
			cell: (info) => formatDateTime(info.getValue()),
		}),
		columnHelper.accessor('action', {
			header: 'Amal',
			size: 110,
			cell: (info) => (
				<Badge variant={ACTION_VARIANT[info.getValue()] ?? 'default'}>
					{ACTION_LABEL[info.getValue()] ?? info.getValue()}
				</Badge>
			),
			meta: {
				filterVariant: 'select',
				filterOptions: [
					{ value: 'CREATE', label: 'Yaratildi' },
					{ value: 'UPDATE', label: 'Yangilandi' },
					{ value: 'DELETE', label: "O'chirildi" },
				],
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.accessor('event_type', {
			header: 'Event turi',
			size: 170,
		}),
		columnHelper.accessor('model_name', {
			header: 'Model',
			size: 150,
			cell: (info) => (
				<span>
					{info.getValue()} #{info.row.original.object_label}
				</span>
			),
		}),
		columnHelper.accessor('user_label', {
			header: 'Foydalanuvchi',
			cell: (info) => info.getValue() ?? info.row.original.user_username ?? '-',
			meta: {
				filterVariant: 'select',
				filterLoadOptions: loadUserOptions,
				filterPlaceholder: 'Barchasi',
			},
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableColumnFilter: false,
			size: 100,
			cell: ({ row }) => (
				<div className='flex justify-end'>
					<Button
						type='button'
						variant='info'
						size='icon'
						aria-label='Batafsil'
						onClick={() => setDetailId(row.original.id)}
					>
						<FaEye />
					</Button>
				</div>
			),
		}),
	];

	if (!isSuperAdmin) {
		return (
			<>
				<PageHeader
					title="O'zgarishlar tarixi"
					breadcrumb={[{ label: 'Asosiy', path: '/' }, { label: "O'zgarishlar tarixi", active: true }]}
				/>
				<Panel title="Ro'yxat">
					<p className='p-4 text-center text-ca-red'>
						<FaExclamationTriangle className='mr-1.5 inline' /> Bu sahifaga faqat Super Admin kira oladi.
					</p>
				</Panel>
			</>
		);
	}

	return (
		<>
			<PageHeader
				title="O'zgarishlar tarixi"
				breadcrumb={[{ label: 'Asosiy', path: '/' }, { label: "O'zgarishlar tarixi", active: true }]}
			/>

			<Panel title="Ro'yxat" onReload={() => refetch()}>
				<div className='mb-4 flex flex-wrap items-end gap-2'>
					<div className='w-40'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Boshlanish sana</label>
						<DatePicker value={startDate} onChange={setStartDate} placeholder='Boshlanish sana' />
					</div>
					<div className='w-40'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Tugash sana</label>
						<DatePicker value={endDate} onChange={setEndDate} placeholder='Tugash sana' />
					</div>
					{(startDate || endDate) && (
						<Button
							type='button'
							variant='white'
							size='sm'
							onClick={() => {
								setStartDate('');
								setEndDate('');
							}}
						>
							Sanani tozalash
						</Button>
					)}
				</div>

				<DataTable
					columns={columns}
					data={results}
					manualPagination
					manualFiltering
					pageCount={paginationMeta?.lastPage ?? -1}
					totalRows={paginationMeta?.total}
					pagination={pagination}
					onPaginationChange={setPagination}
					columnFilters={columnFilters}
					onColumnFiltersChange={(filters) => {
						setColumnFilters(filters);
						setPagination((p) => ({ ...p, pageIndex: 0 }));
					}}
					enablePagination
					enableSorting={false}
					enableGlobalFilter={false}
					enableColumnFilters={true}
					enableColumnVisibility
					enableStriping
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>

			<CompanyEventLogDetailModal id={detailId} setId={setDetailId} />
		</>
	);
}

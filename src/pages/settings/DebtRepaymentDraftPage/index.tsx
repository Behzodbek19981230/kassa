import { createColumnHelper, type PaginationState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { FaTrash, FaExclamationTriangle, FaUndo } from 'react-icons/fa';
import {
	Button,
	buttonProps,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	DatePicker,
	Input,
	PageHeader,
	Panel,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { usePermissions } from '@/lib/permissions';
import { clientService } from '@/services/client/client.service';
import { useDebtRepaymentDraftGroupedListQuery } from '@/services/debt-repayment/debt-repayment.queries';
import type { DebtRepaymentGroupedItem } from '@/services/debt-repayment/debt-repayment.types';
import DebtRepaymentHardDeleteModal from '@/pages/settings/DebtRepaymentPage/components/DebtRepaymentHardDeleteModal';
import DebtRepaymentReturnModal from '@/pages/settings/DebtRepaymentPage/components/DebtRepaymentReturnModal';

type GroupedDraftRepaymentRow = DebtRepaymentGroupedItem & {
	_dateLabel: string;
	_groupId: number;
};

const columnHelper = createColumnHelper<GroupedDraftRepaymentRow>();

interface FilterState {
	client: string;
	startDate: string;
	endDate: string;
	search: string;
}

const emptyFilters: FilterState = { client: '', startDate: '', endDate: '', search: '' };

export default function DebtRepaymentDraftPage() {
	const { canWrite } = useCurrentCompany();
	const { canEditOwned } = usePermissions();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
	const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);

	const hasAppliedFilters = Object.values(appliedFilters).some(Boolean);

	const { data, isLoading, isFetching, isError, error, refetch } = useDebtRepaymentDraftGroupedListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		client: appliedFilters.client ? Number(appliedFilters.client) : undefined,
		start_date: appliedFilters.startDate || undefined,
		end_date: appliedFilters.endDate || undefined,
		search: appliedFilters.search || undefined,
	});

	const paginationMeta = data?.pagination;

	const results: GroupedDraftRepaymentRow[] = useMemo(
		() =>
			(data?.results.groups ?? []).flatMap((group, groupIndex) =>
				group.items.map((item) => ({
					...item,
					_dateLabel: group.date_label,
					_groupId: groupIndex,
				})),
			),
		[data],
	);

	const loadClientOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await clientService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.fio })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	function handleSearch() {
		setAppliedFilters(draftFilters);
		setPagination((p) => ({ ...p, pageIndex: 0 }));
	}

	function handleClear() {
		setDraftFilters(emptyFilters);
		setAppliedFilters(emptyFilters);
		setPagination((p) => ({ ...p, pageIndex: 0 }));
	}

	const columns = [
		columnHelper.display({
			id: 'sana',
			header: 'Sana',
			size: 100,
			cell: ({ row }) => <span className='font-semibold text-ca-theme'>{row.original._dateLabel}</span>,
			meta: { rowSpanGroupKey: (row) => row._groupId },
		}),
		columnHelper.accessor('client_name', {
			header: 'Mijoz',
			cell: (info) => (
				<div>
					<div>{info.getValue()}</div>
					{info.row.original.client_phone && (
						<div className='text-[11px] text-ca-text'>{info.row.original.client_phone}</div>
					)}
				</div>
			),
		}),
		columnHelper.accessor('paid_amount', {
			header: "To'langan ($)",
			size: 120,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.accessor('total_debt_old', {
			header: 'Eski qarz ($)',
			size: 120,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.accessor('total_debt', {
			header: 'Qolgan qarz ($)',
			size: 130,
			cell: (info) => {
				const value = Number(info.getValue()) || 0;
				return (
					<span className={value > 0 ? 'font-bold text-ca-red' : 'font-bold text-ca-green'}>
						{formatNumber(value, 2)}
					</span>
				);
			},
		}),
		columnHelper.accessor('text', { header: 'Izoh' }),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			size: 110,
			cell: ({ row }) => {
				const item = row.original;
				const canEdit = canEditOwned(item);
				return (
					<div className='flex justify-end gap-1'>
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{
								...buttonProps(<FaUndo />, 'success', 'icon'),
								'aria-label': 'Qayta tiklash',
								disabled: !canWrite || !canEdit,
							}}
							dialog={DebtRepaymentReturnModal}
							dialogProps={{ id: item.id, clientName: item.client_name }}
						/>
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{
								...buttonProps(<FaTrash />, 'danger', 'icon'),
								'aria-label': "Batamom o'chirish",
								disabled: !canWrite || !canEdit,
							}}
							dialog={DebtRepaymentHardDeleteModal}
							dialogProps={{ id: item.id, clientName: item.client_name }}
						/>
					</div>
				);
			},
		}),
	];

	return (
		<>
			<PageHeader
				title="Qarz to'lov karzinka"
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: "To'langan qarzlar", path: '/settings/debt-repayments' },
					{ label: "Qarz to'lov karzinka", active: true },
				]}
			/>

			<Panel title="O'chirilgan to'lovlar" onReload={() => refetch()}>
				<div className='mb-4 flex flex-wrap items-end gap-2'>
					<div className='w-40'>
						<DatePicker
							value={draftFilters.startDate}
							onChange={(v) => setDraftFilters((f) => ({ ...f, startDate: v }))}
							placeholder='Boshlanish sana'
						/>
					</div>
					<div className='w-40'>
						<DatePicker
							value={draftFilters.endDate}
							onChange={(v) => setDraftFilters((f) => ({ ...f, endDate: v }))}
							placeholder='Tugash sana'
						/>
					</div>
					<div className='w-48'>
						<Combobox
							clearable
							value={draftFilters.client}
							onChange={(v) => setDraftFilters((f) => ({ ...f, client: v }))}
							loadOptions={loadClientOptions}
							placeholder='Mijoz tanlang'
							searchPlaceholder='Qidirish...'
						/>
					</div>
					<div className='w-56'>
						<Input
							value={draftFilters.search}
							onChange={(e) => setDraftFilters((f) => ({ ...f, search: e.target.value }))}
							placeholder="FIO yoki telefon bo'yicha qidirish"
						/>
					</div>
					<Button type='button' variant='info' size='sm' onClick={handleSearch}>
						Qidirish
					</Button>
					<Button type='button' variant='white' size='sm' disabled={!hasAppliedFilters} onClick={handleClear}>
						Tozalash
					</Button>
				</div>

				<DataTable
					columns={columns}
					data={results}
					manualPagination
					pageCount={paginationMeta?.lastPage ?? -1}
					totalRows={paginationMeta?.total}
					pagination={pagination}
					onPaginationChange={setPagination}
					enablePagination
					enableSorting={false}
					enableGlobalFilter={false}
					enableColumnFilters={false}
					enableColumnVisibility
					columnVisibilityKey='debt-repayment-draft'
					enableStriping
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : "Draft to'lovlar yo'q"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>
		</>
	);
}

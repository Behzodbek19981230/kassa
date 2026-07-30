import { createColumnHelper, type PaginationState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import {
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	DatePicker,
	Input,
	Panel,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { consignorService } from '@/services/consignor/consignor.service';
import { useMyDebtHistoryGroupedListQuery } from '@/services/my-debt/my-debt-history.queries';
import type { MyDebtHistoryGroupedItem } from '@/services/my-debt/my-debt-history.types';

type GroupedMyDebtHistoryRow = MyDebtHistoryGroupedItem & {
	_groupId: number;
};

const columnHelper = createColumnHelper<GroupedMyDebtHistoryRow>();

interface FilterState {
	consignor: string;
	startDate: string;
	endDate: string;
	search: string;
}

const emptyFilters: FilterState = { consignor: '', startDate: '', endDate: '', search: '' };

export default function MyDebtHistoryTab() {
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
	const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);

	const hasAppliedFilters = Object.values(appliedFilters).some(Boolean);

	const { data, isLoading, isFetching, isError, error, refetch } = useMyDebtHistoryGroupedListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		consignor: appliedFilters.consignor ? Number(appliedFilters.consignor) : undefined,
		start_date: appliedFilters.startDate || undefined,
		end_date: appliedFilters.endDate || undefined,
		search: appliedFilters.search || undefined,
	});

	const paginationMeta = data?.pagination;

	const results: GroupedMyDebtHistoryRow[] = useMemo(
		() =>
			(data?.results.groups ?? []).flatMap((group, groupIndex) =>
				group.items.map((item) => ({
					...item,
					_groupId: groupIndex,
				})),
			),
		[data],
	);

	const loadConsignorOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await consignorService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.name })),
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
			cell: ({ row }) => <span className='font-semibold text-ca-theme'>{row.original.date_label}</span>,
			meta: {
				rowSpanGroupKey: (row) => row._groupId,
			},
		}),
		columnHelper.display({
			id: 'consignor',
			header: "Yuk jo'natuvchi",
			cell: ({ row }) => row.original.consignor?.name ?? '',
		}),
		columnHelper.accessor('all_summ_dollar', {
			header: "To'langan summa ($)",
			size: 140,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.accessor('discount_amount', {
			header: 'Chegirma ($)',
			size: 120,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.accessor('remaining_debt', {
			header: 'Qolgan qarz ($)',
			size: 130,
			cell: (info) => {
				const value = Number(info.getValue()) || 0;
				return (
					<span className={value > 0 ? 'font-bold text-ca-red' : 'font-bold text-ca-green'}>
						{formatNumber(value, 2)} $
					</span>
				);
			},
		}),
		columnHelper.accessor('datetime_label', { header: 'Sana vaqt', size: 140 }),
		columnHelper.accessor('created_by_name', { header: 'Hodim', size: 150 }),
	];

	return (
		<Panel title="Ro'yxat" onReload={() => refetch()}>
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
						value={draftFilters.consignor}
						onChange={(v) => setDraftFilters((f) => ({ ...f, consignor: v }))}
						loadOptions={loadConsignorOptions}
						placeholder="Yuk jo'natuvchi tanlang"
						searchPlaceholder='Qidirish...'
					/>
				</div>
				<div className='w-56'>
					<Input
						value={draftFilters.search}
						onChange={(e) => setDraftFilters((f) => ({ ...f, search: e.target.value }))}
						placeholder="Yuk jo'natuvchi nomi bo'yicha qidirish"
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
				manualFiltering
				pageCount={paginationMeta?.lastPage ?? -1}
				totalRows={paginationMeta?.total}
				pagination={pagination}
				onPaginationChange={setPagination}
				enablePagination
				enableSorting={false}
				enableGlobalFilter={false}
				enableColumnFilters={false}
				enableStriping
				isLoading={isLoading || isFetching}
				emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : "Ma'lumot topilmadi"}
				emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
			/>
		</Panel>
	);
}

import { createColumnHelper, type PaginationState } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { FaBan, FaExclamationTriangle, FaExpand, FaUndo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
	Button,
	buttonProps,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	DatePicker,
	Input,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { formatNumber } from '@/lib/number';
import { clientService } from '@/services/client/client.service';
import { useOrderAccountHistoryDraftGroupedListQuery } from '@/services/order-account-history/order-account-history.queries';
import type { OrderAccountHistoryItem } from '@/services/order-account-history/order-account-history.types';
import OrderHardDeleteModal from '@/pages/CustomerOrderHistoryPage/components/OrderHardDeleteModal';
import OrderReturnModal from '@/pages/CustomerOrderHistoryPage/components/OrderReturnModal';

type GroupedDraftOrderItem = OrderAccountHistoryItem & {
	_dateLabel: string;
	_groupId: number;
};

const columnHelper = createColumnHelper<GroupedDraftOrderItem>();

interface FilterState {
	client: string;
	startDate: string;
	endDate: string;
	search: string;
}

const emptyFilters: FilterState = { client: '', startDate: '', endDate: '', search: '' };

interface OrderAccountHistoryDraftTabProps {
	onRefetchReady?: (refetch: () => void) => void;
}

export default function OrderAccountHistoryDraftTab({ onRefetchReady }: OrderAccountHistoryDraftTabProps) {
	const navigate = useNavigate();
	const { canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
	const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);

	const hasAppliedFilters = Object.values(appliedFilters).some(Boolean);

	const { data, isLoading, isFetching, isError, refetch } = useOrderAccountHistoryDraftGroupedListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		client: appliedFilters.client ? Number(appliedFilters.client) : undefined,
		start_date: appliedFilters.startDate || undefined,
		end_date: appliedFilters.endDate || undefined,
		search: appliedFilters.search || undefined,
	});

	useEffect(() => {
		onRefetchReady?.(refetch);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refetch]);

	const paginationMeta = data?.pagination;

	const results: GroupedDraftOrderItem[] = useMemo(
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
		columnHelper.accessor('client_name', { header: 'Mijoz' }),
		columnHelper.accessor('all_product_sum', {
			header: 'Mahsulot summasi ($)',
			size: 150,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.accessor('all_summ_dollar', {
			header: "To'lanadigan summa ($)",
			size: 160,
			cell: (info) => formatNumber(info.getValue(), 2),
		}),
		columnHelper.accessor('total_debt', {
			header: 'Umumiy qarz ($)',
			size: 140,
			cell: (info) => {
				const value = Number(info.getValue()) || 0;
				return (
					<span className={value > 0 ? 'font-bold text-ca-red' : 'font-bold text-ca-green'}>
						{formatNumber(value, 2)}
					</span>
				);
			},
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			size: 160,
			cell: ({ row }) => {
				const item = row.original;
				return (
					<div className='flex justify-end gap-1'>
						<Button
							type='button'
							variant='default'
							size='icon'
							aria-label='Batafsil'
							onClick={() => navigate(`/customer-order-history/${item.id}`)}
						>
							<FaExpand />
						</Button>
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{
								...buttonProps(<FaUndo />, 'success', 'icon'),
								'aria-label': 'Qayta tiklash',
								disabled: !canWrite,
							}}
							dialog={OrderReturnModal}
							dialogProps={{ id: item.id, clientName: item.client_name }}
						/>
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{
								...buttonProps(<FaBan />, 'danger', 'icon'),
								'aria-label': "Batamom o'chirish",
								disabled: !canWrite,
							}}
							dialog={OrderHardDeleteModal}
							dialogProps={{ id: item.id, clientName: item.client_name }}
						/>
					</div>
				);
			},
		}),
	];

	return (
		<div>
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
						placeholder="FIO, telefon yoki izoh bo'yicha qidirish"
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
				columnVisibilityKey='order-account-history-draft'
				enableStriping
				isLoading={isLoading || isFetching}
				emptyMessage={isError ? 'Xatolik yuz berdi' : "Draft buyurtmalar yo'q"}
				emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
			/>
		</div>
	);
}

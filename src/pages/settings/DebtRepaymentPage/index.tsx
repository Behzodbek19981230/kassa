import { createColumnHelper, type PaginationState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { FaEdit, FaExclamationTriangle, FaFilePdf, FaTrash } from 'react-icons/fa';
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
	useNotification,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { loadBlobIntoTab, openPendingTab } from '@/lib/blob';
import { useCurrentCompany } from '@/lib/company';
import { formatNumber } from '@/lib/number';
import { clientService } from '@/services/client/client.service';
import { debtRepaymentService } from '@/services/debt-repayment/debt-repayment.service';
import { useDebtRepaymentGroupedListQuery } from '@/services/debt-repayment/debt-repayment.queries';
import type { DebtRepayment, DebtRepaymentGroupedItem } from '@/services/debt-repayment/debt-repayment.types';
import DebtRepaymentFormModal from '@/pages/settings/DebtRepaymentPage/components/DebtRepaymentFormModal';
import DeleteDebtRepaymentModal from '@/pages/settings/DebtRepaymentPage/components/DeleteDebtRepaymentModal';

type GroupedDebtRepaymentRow = DebtRepaymentGroupedItem & {
	_dateLabel: string;
	_groupId: number;
};

const columnHelper = createColumnHelper<GroupedDebtRepaymentRow>();

interface FilterState {
	client: string;
	startDate: string;
	endDate: string;
	search: string;
}

const emptyFilters: FilterState = { client: '', startDate: '', endDate: '', search: '' };

/** The grouped listing endpoint returns a lighter shape than `/debt-repayment/{id}/` — this
 * fills in the few fields the edit/delete modals need before they refetch the full record. */
function toDebtRepayment(item: DebtRepaymentGroupedItem): DebtRepayment {
	return {
		id: item.id,
		company: item.company,
		client: item.client,
		client_detail: { fio: item.client_name } as DebtRepayment['client_detail'],
		created_by: item.created_by,
		summa: item.all_summ_dollar,
		text: item.text,
		date: item.date,
		sum_som: item.sum_som,
		summ_dollar: item.summ_dollar,
		summ_cart: item.summ_cart,
		sum_transfers: item.sum_transfers,
		total_debt: item.total_debt,
		exchange_rate: item.exchange_rate,
		discount_amount: item.discount_amount,
		all_summ_dollar: item.all_summ_dollar,
		total_debt_old: item.total_debt_old,
		is_delete: 0,
		cr_date_time: item.datetime,
		is_worker: null,
		zdacha_sum: item.zdacha_sum,
		zdacha_dollar: item.zdacha_dollar,
	};
}

export default function DebtRepaymentPage() {
	const { canWrite } = useCurrentCompany();
	const { notify } = useNotification();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
	const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);
	const [printingId, setPrintingId] = useState<number | null>(null);

	const hasAppliedFilters = Object.values(appliedFilters).some(Boolean);

	const { data, isLoading, isFetching, isError, refetch } = useDebtRepaymentGroupedListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		client: appliedFilters.client ? Number(appliedFilters.client) : undefined,
		start_date: appliedFilters.startDate || undefined,
		end_date: appliedFilters.endDate || undefined,
		search: appliedFilters.search || undefined,
	});

	const paginationMeta = data?.pagination;

	const results: GroupedDebtRepaymentRow[] = useMemo(
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

	async function handlePrint(item: GroupedDebtRepaymentRow) {
		if (!item.print_url) return;
		const tab = openPendingTab();
		setPrintingId(item.id);
		try {
			const blob = await debtRepaymentService.printByUrl(item.print_url);
			loadBlobIntoTab(blob, tab);
		} catch {
			tab?.close();
			notify({ title: 'Xatolik', text: "PDF yuklab bo'lmadi" });
		} finally {
			setPrintingId(null);
		}
	}

	const columns = [
		columnHelper.display({
			id: 'sana',
			header: 'Sana',
			size: 100,
			cell: ({ row }) => <span className='font-semibold text-ca-theme'>{row.original._dateLabel}</span>,
			meta: {
				rowSpanGroupKey: (row) => row._groupId,
			},
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
		columnHelper.accessor('created_by_name', { header: 'Kim qabul qildi', size: 150 }),
		columnHelper.accessor('text', { header: 'Izoh' }),
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
							aria-label='PDF'
							disabled={printingId === item.id}
							onClick={() => handlePrint(item)}
						>
							<FaFilePdf />
						</Button>
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{
								...buttonProps(<FaEdit />, 'warning', 'icon'),
								'aria-label': 'Tahrirlash',
								disabled: !canWrite,
							}}
							dialog={DebtRepaymentFormModal}
							dialogProps={{ mode: 'edit' as const, item: toDebtRepayment(item) }}
						/>
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{
								...buttonProps(<FaTrash />, 'danger', 'icon'),
								'aria-label': "O'chirish",
								disabled: !canWrite,
							}}
							dialog={DeleteDebtRepaymentModal}
							dialogProps={{ item: toDebtRepayment(item) }}
						/>
					</div>
				);
			},
		}),
	];

	return (
		<>
			<PageHeader
				title="To'langan qarzlar"
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: "To'langan qarzlar", active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
							dialog={DebtRepaymentFormModal}
							dialogProps={{ mode: 'create' as const }}
						/>
					)
				}
				onReload={() => refetch()}
			>
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
					enableStriping
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>
		</>
	);
}

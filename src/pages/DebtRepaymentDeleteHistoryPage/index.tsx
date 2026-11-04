import { createColumnHelper, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaArrowLeft, FaExclamationTriangle, FaEye, FaTrashAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button, DataTable, Panel } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import DebtRepaymentDeleteHistoryModal from '@/pages/DebtRepaymentDeleteHistoryPage/DebtRepaymentDeleteHistoryModal';
import { formatMoney, PAID_KEYS, pickField, pickText } from '@/pages/DebtRepaymentDeleteHistoryPage/utils';
import StatCard from '@/pages/TwoStageImport/components/StatCard';
import { formatTashkentDate, formatTashkentDateTime } from '@/pages/TwoStageImport/utils';
import { useDebtRepaymentDeleteHistoryListQuery } from '@/services/debt-repayment-delete-history/debt-repayment-delete-history.queries';
import type { DebtRepaymentDeleteHistoryRow } from '@/services/debt-repayment-delete-history/debt-repayment-delete-history.types';

const columnHelper = createColumnHelper<DebtRepaymentDeleteHistoryRow>();

/** Hard-deleted debt repayments (`/debt-repayment-delete-history/`), opened from the repayment draft cart. Read-only. */
export default function DebtRepaymentDeleteHistoryPage() {
	const navigate = useNavigate();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	// The row stays set after closing so the modal keeps its content during the close animation.
	const [viewRow, setViewRow] = useState<DebtRepaymentDeleteHistoryRow | null>(null);
	const [viewOpen, setViewOpen] = useState(false);

	const { data, isLoading, isFetching, isError, error, refetch } = useDebtRepaymentDeleteHistoryListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
	});

	const paginationMeta = data?.pagination;

	const columns = [
		columnHelper.display({
			id: 'index',
			header: '№',
			size: 50,
			cell: ({ row }) => pagination.pageIndex * pagination.pageSize + row.index + 1,
		}),
		columnHelper.display({
			id: 'date',
			header: 'Sana',
			size: 110,
			cell: ({ row }) => (
				<span className='font-semibold text-ca-theme'>
					{formatTashkentDate(pickText(row.original, 'repayment_date', 'date', 'cr_date_time') || null)}
				</span>
			),
		}),
		columnHelper.display({
			id: 'client',
			header: 'Mijoz',
			cell: ({ row }) => {
				const phone = pickText(row.original, 'client_phone');
				return (
					<div>
						<div>{pickText(row.original, 'client_name', 'client_fio', 'client_detail') || '-'}</div>
						{phone && <div className='text-[11px] text-ca-text'>{phone}</div>}
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'paid',
			header: "To'langan ($)",
			size: 120,
			cell: ({ row }) => formatMoney(pickField(row.original, ...PAID_KEYS)),
		}),
		columnHelper.display({
			id: 'total_debt_old',
			header: 'Eski qarz ($)',
			size: 120,
			cell: ({ row }) => formatMoney(pickField(row.original, 'total_debt_old')),
		}),
		columnHelper.display({
			id: 'total_debt',
			header: 'Qolgan qarz ($)',
			size: 130,
			cell: ({ row }) => {
				const value = Number(pickField(row.original, 'total_debt')) || 0;
				return (
					<span className={value > 0 ? 'font-bold text-ca-red' : 'font-bold text-ca-green'}>
						{formatNumber(value, 2)}
					</span>
				);
			},
		}),
		columnHelper.display({
			id: 'created_by',
			header: 'Kim yaratgan',
			cell: ({ row }) =>
				pickText(row.original, 'original_created_by_name', 'created_by_name', 'created_by_detail') || '-',
		}),
		columnHelper.display({
			id: 'deleted_by',
			header: "Kim o'chirgan",
			cell: ({ row }) => pickText(row.original, 'deleted_by_name', 'deleted_by_detail') || '-',
		}),
		columnHelper.display({
			id: 'deleted_at',
			header: "O'chirilgan vaqt",
			size: 150,
			cell: ({ row }) => (
				<span className='text-ca-red'>
					{formatTashkentDateTime(pickText(row.original, 'deleted_at', 'deleted_time', 'created_time') || null)}
				</span>
			),
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Amal',
			size: 60,
			meta: { align: 'right' },
			cell: ({ row }) => (
				<Button
					type='button'
					variant='primary'
					size='icon'
					aria-label="Ko'rish"
					onClick={() => {
						setViewRow(row.original);
						setViewOpen(true);
					}}
				>
					<FaEye />
				</Button>
			),
		}),
	];

	return (
		<Panel
			title="O'chirilgan qarz to'lovlar tarixi"
			actions={
				<Button type='button' variant='info' size='xs' onClick={() => navigate('/settings/debt-repayments-drafts')}>
					<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
				</Button>
			}
			onReload={() => refetch()}
		>
			<div className='-mx-2.5 flex flex-wrap'>
				<StatCard
					icon={<FaTrashAlt />}
					label="Jami o'chirilgan to'lovlar"
					value={formatNumber(paginationMeta?.total ?? 0)}
					accent='danger'
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.results ?? []}
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
				columnVisibilityKey='debt-repayment-delete-history'
				enableStriping
				isLoading={isLoading || isFetching}
				emptyMessage={
					isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : "O'chirilgan qarz to'lovlar tarixi mavjud emas."
				}
				emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
			/>

			<DebtRepaymentDeleteHistoryModal open={viewOpen} setOpen={setViewOpen} row={viewRow} />
		</Panel>
	);
}

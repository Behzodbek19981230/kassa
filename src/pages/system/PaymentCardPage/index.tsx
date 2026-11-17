import {
	createColumnHelper,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { FaChartBar, FaEdit, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Button, buttonProps, buttonVariants, DataTable, Panel, Tooltip } from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useCardPaymentTotalsQuery } from '@/services/card-payment/card-payment.queries';
import { usePaymentCardListQuery } from '@/services/payment-card/payment-card.queries';
import type { PaymentCard } from '@/services/payment-card/payment-card.types';
import CardIdentity, { CardStatusPill } from '@/pages/system/PaymentCardPage/components/CardIdentity';
import DeletePaymentCardModal from '@/pages/system/PaymentCardPage/components/DeletePaymentCardModal';
import PaymentCardFormModal from '@/pages/system/PaymentCardPage/components/PaymentCardFormModal';

const columnHelper = createColumnHelper<PaymentCard>();

export default function PaymentCardPage() {
	const { canWrite } = useCurrentCompany();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
	const [sorting, setSorting] = useState<SortingState>([{ id: 'sort_order', desc: false }]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : 'sort_order';
	const nameFilter = columnFilters.find((f) => f.id === 'name')?.value as string | undefined;

	const { data, isLoading, isFetching, isError, error, refetch } = usePaymentCardListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: nameFilter || undefined,
		ordering,
	});
	// "Kassada hozir": what each card has received, from the totals endpoint.
	const totalsQuery = useCardPaymentTotalsQuery();
	const totalsByCard = useMemo(
		() => new Map((totalsQuery.data?.cards ?? []).map((row) => [row.payment_card, row])),
		[totalsQuery.data],
	);

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;
	const nextSortOrder = Math.max(paginationMeta?.total ?? 0, ...results.map((c) => c.sort_order ?? 0)) + 1;

	const columns = [
		columnHelper.accessor('sort_order', {
			header: '#',
			size: 60,
			enableColumnFilter: false,
		}),
		columnHelper.accessor('name', {
			header: 'Karta',
			meta: { align: 'left' },
			enableSorting: false,
			cell: ({ row }) => <CardIdentity card={row.original} />,
		}),
		columnHelper.accessor('owner_name', {
			header: 'Egasi',
			meta: { align: 'left' },
			enableSorting: false,
			enableColumnFilter: false,
			cell: (info) => info.getValue() || '—',
		}),
		columnHelper.accessor('bank', {
			header: 'Bank',
			meta: { align: 'left' },
			enableSorting: false,
			enableColumnFilter: false,
			cell: (info) => info.getValue() || '—',
		}),
		columnHelper.display({
			id: 'balance',
			header: 'Kassada hozir',
			meta: { align: 'right' },
			enableSorting: false,
			enableColumnFilter: false,
			cell: ({ row }) => {
				const totals = totalsByCard.get(row.original.id);
				return (
					<div className='text-right'>
						<div className='font-bold text-ca-heading'>{formatNumber(totals?.total ?? 0)}</div>
						<div className='text-xs text-ca-text'>{totals?.count ? `${totals.count} ta to'lov` : '—'}</div>
					</div>
				);
			},
		}),
		columnHelper.accessor('is_active', {
			header: 'Holati',
			size: 110,
			enableColumnFilter: false,
			cell: (info) => <CardStatusPill active={info.getValue()} />,
		}),
		columnHelper.accessor('note', {
			header: 'Izoh',
			meta: { align: 'left' },
			enableSorting: false,
			enableColumnFilter: false,
			cell: (info) => (
				<span className='block max-w-[200px] truncate' title={info.getValue() || undefined}>
					{info.getValue() || '—'}
				</span>
			),
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Amal',
			meta: { align: 'right' },
			enableSorting: false,
			enableColumnFilter: false,
			size: 150,
			cell: ({ row }) => (
				<div className='flex items-center justify-end gap-1'>
					<Tooltip content='Statistika'>
						<Link
							to={`/system/payment-cards/${row.original.id}/payments`}
							aria-label='Statistika'
							className={buttonVariants({ variant: 'info', size: 'icon' })}
						>
							<FaChartBar />
						</Link>
					</Tooltip>
					{canWrite && (
						<OpenDialogButton
							element={(props) => <Button {...props} />}
							elementProps={{
								...buttonProps(<FaEdit />, 'warning', 'icon'),
								'aria-label': 'Tahrirlash',
							}}
							dialog={PaymentCardFormModal}
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
							dialog={DeletePaymentCardModal}
							dialogProps={{ item: row.original }}
						/>
					)}
				</div>
			),
		}),
	];

	return (
		<Panel
			title="Do'kon kartalari"
			actions={
				canWrite && (
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={buttonProps("Qo'shish +", 'info', 'xs')}
						dialog={PaymentCardFormModal}
						dialogProps={{ mode: 'create' as const, nextSortOrder }}
					/>
				)
			}
			onReload={() => {
				refetch();
				totalsQuery.refetch();
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
				onColumnFiltersChange={(filters) => {
					setColumnFilters(filters);
					setPagination((p) => ({ ...p, pageIndex: 0 }));
				}}
				enablePagination
				enableGlobalFilter={false}
				enableColumnFilters
				enableColumnVisibility
				columnVisibilityKey='payment-cards'
				enableSorting
				enableStriping
				isLoading={isLoading || isFetching}
				emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : "Ma'lumot topilmadi"}
				emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
			/>
			<div className='mt-3 flex items-center justify-between rounded-md border border-ca-border bg-ca-silver px-4 py-3'>
				<span className='font-bold text-ca-heading'>Jami karta</span>
				<span className='text-base font-bold text-ca-heading'>
					{totalsQuery.isError ? '—' : formatNumber(totalsQuery.data?.total ?? 0)}
				</span>
			</div>
		</Panel>
	);
}

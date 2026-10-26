import { createColumnHelper, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaArrowLeft, FaExclamationTriangle, FaEye, FaSyncAlt, FaTrashAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	DataTable,
	Panel,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import StatCard from '@/pages/TwoStageImport/components/StatCard';
import { formatTashkentDate, formatTashkentDateTime } from '@/pages/TwoStageImport/utils';
import { clientService } from '@/services/client/client.service';
import { useOrderDeleteHistoryListQuery } from '@/services/order-delete-history/order-delete-history.queries';
import type { OrderDeleteHistoryRow } from '@/services/order-delete-history/order-delete-history.types';

const columnHelper = createColumnHelper<OrderDeleteHistoryRow>();

/** Hard-deleted orders (`/order-delete-history/`), opened from the cart drafts page. Super Admin only, read-only. */
export default function OrderDeleteHistoryPage() {
	const navigate = useNavigate();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [client, setClient] = useState('');

	const { data, isLoading, isFetching, isError, error, refetch } = useOrderDeleteHistoryListQuery({
		client_id: client ? Number(client) : undefined,
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
	});

	const paginationMeta = data?.pagination;

	const loadClientOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await clientService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.fio })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	function handleClientChange(value: string) {
		setClient(value);
		setPagination((p) => ({ ...p, pageIndex: 0 }));
	}

	const columns = [
		columnHelper.display({
			id: 'index',
			header: '#',
			size: 50,
			cell: ({ row }) => pagination.pageIndex * pagination.pageSize + row.index + 1,
		}),
		columnHelper.accessor('client_name', {
			header: 'Mijoz',
			cell: (info) => <span className='font-semibold text-ca-theme'>{info.getValue() || '-'}</span>,
		}),
		columnHelper.accessor('order_date', {
			header: 'Buyurtma sanasi',
			size: 130,
			cell: (info) => formatTashkentDate(info.getValue()),
		}),
		columnHelper.accessor('original_created_by_name', {
			header: 'Kim yaratgan',
			cell: (info) => info.getValue() || '-',
		}),
		columnHelper.accessor('deleted_by_name', {
			header: "Kim o'chirgan",
			cell: (info) => info.getValue() || '-',
		}),
		columnHelper.accessor('deleted_at', {
			header: "O'chirilgan vaqt",
			size: 150,
			cell: (info) => <span className='text-ca-red'>{formatTashkentDateTime(info.getValue())}</span>,
		}),
		columnHelper.accessor('product_count', {
			header: 'Mahsulotlar soni',
			size: 130,
			cell: (info) => formatNumber(info.getValue()),
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Amal',
			size: 100,
			meta: { align: 'right' },
			cell: ({ row }) => (
				<Button
					type='button'
					variant='primary'
					size='xs'
					onClick={() => navigate(`/cart-drafts/deleted-orders/${row.original.id}`)}
				>
					<FaEye className='mr-1.5' /> Ko'rish
				</Button>
			),
		}),
	];

	return (
		<Panel
			title="O'chirilgan buyurtmalar tarixi"
			actions={
				<Button type='button' variant='info' size='xs' onClick={() => navigate('/cart-drafts')}>
					<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
				</Button>
			}
			onReload={() => refetch()}
		>
			<div className='mb-4 flex flex-wrap items-end gap-2'>
				<div className='w-full sm:w-72'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>Mijoz:</label>
					<Combobox
						clearable
						value={client}
						onChange={handleClientChange}
						loadOptions={loadClientOptions}
						placeholder='Mijozni tanlang'
						searchPlaceholder='Qidirish...'
					/>
				</div>
				<Button type='button' variant='white' size='sm' disabled={!client} onClick={() => handleClientChange('')}>
					<FaSyncAlt className='mr-1.5' /> Filtrni tozalash
				</Button>
			</div>

			<div className='-mx-2.5 flex flex-wrap'>
				<StatCard
					icon={<FaTrashAlt />}
					label="Jami o'chirilgan buyurtmalar"
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
				columnVisibilityKey='order-delete-history'
				enableStriping
				isLoading={isLoading || isFetching}
				emptyMessage={
					isError
						? getApiErrorMessage(error, 'Xatolik yuz berdi')
						: "O'chirilgan buyurtmalar tarixi mavjud emas."
				}
				emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
			/>
		</Panel>
	);
}

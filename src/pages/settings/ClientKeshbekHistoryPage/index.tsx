import { createColumnHelper, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, DataTable, Panel } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { formatTashkentDateTime, formatUserName } from '@/pages/TwoStageImport/utils';
import { useClientQuery } from '@/services/client/client.queries';
import { useKeshbekHistoryListQuery } from '@/services/keshbek-history/keshbek-history.queries';
import type { KeshbekHistory } from '@/services/keshbek-history/keshbek-history.types';

const columnHelper = createColumnHelper<KeshbekHistory>();

const formatMoney = (value?: string | number | null) =>
	value === undefined || value === null || value === '' ? '-' : `${formatNumber(Number(value) || 0, 2)} $`;

/** Cashback movements of one client (`/keshbek-history/?client=`), opened from the clients list. */
export default function ClientKeshbekHistoryPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const clientId = Number(id);
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

	const { data: client } = useClientQuery(clientId || undefined);
	const { data, isLoading, isFetching, isError, error, refetch } = useKeshbekHistoryListQuery({
		client: clientId,
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		columnHelper.display({
			id: 'index',
			header: '#',
			cell: ({ row }) => pagination.pageIndex * pagination.pageSize + row.index + 1,
		}),
		columnHelper.accessor('created_time', {
			header: 'Sana',
			cell: (info) => formatTashkentDateTime(info.getValue()),
		}),
		columnHelper.accessor('amount', {
			header: 'Miqdori ($)',
			cell: (info) => {
				const value = Number(info.getValue()) || 0;
				return (
					<span className={value < 0 ? 'font-bold text-ca-red' : 'font-bold text-ca-green'}>
						{value > 0 ? '+' : ''}
						{formatNumber(value, 2)} $
					</span>
				);
			},
		}),
		columnHelper.accessor('keshbek_before', {
			header: 'Oldingi keshbek ($)',
			cell: (info) => formatMoney(info.getValue()),
		}),
		columnHelper.accessor('keshbek_after', {
			header: 'Keyingi keshbek ($)',
			cell: (info) => formatMoney(info.getValue()),
		}),
		columnHelper.accessor('comment', {
			header: 'Izoh',
			cell: (info) => info.getValue() || info.row.original.type || '-',
		}),
		columnHelper.display({
			id: 'created_by',
			header: 'Kim tomonidan',
			cell: ({ row }) => (row.original.created_by_detail ? formatUserName(row.original.created_by_detail) : '-'),
		}),
	];

	return (
		<Panel
			title={`${client?.fio ?? 'Mijoz'} — keshbek tarixi${client ? ` (joriy: ${formatMoney(client.keshbek)})` : ''}`}
			onReload={() => refetch()}
			actions={
				<Button type='button' variant='white' size='xs' onClick={() => navigate('/settings/clients')}>
					<FaArrowLeft className='mr-1.5' /> Orqaga
				</Button>
			}
		>
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
				enableStriping
				isLoading={isLoading || isFetching}
				emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : "Ma'lumot topilmadi"}
				emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
			/>
		</Panel>
	);
}

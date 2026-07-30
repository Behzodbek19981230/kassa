import { createColumnHelper, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaEye, FaExclamationTriangle, FaPaperPlane } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button, DataTable, PageHeader, Panel } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { BroadcastStatusBadge } from '@/pages/TelegramBroadcastPage/components/StatusBadge';
import { useTelegramBroadcastListQuery } from '@/services/telegram-broadcast/telegram-broadcast.queries';
import type { TelegramBroadcastJob } from '@/services/telegram-broadcast/telegram-broadcast.types';

const columnHelper = createColumnHelper<TelegramBroadcastJob>();

function formatDateTime(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	const date = d.toLocaleDateString('ru-RU');
	const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	return `${date} ${time}`;
}

export default function TelegramBroadcastPage() {
	const navigate = useNavigate();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

	const { data, isLoading, isFetching, isError, error, refetch } = useTelegramBroadcastListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
	});

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		columnHelper.accessor('id', { header: 'ID', size: 70 }),
		columnHelper.accessor('text', {
			header: 'Text',
			cell: (info) => info.getValue() || '-',
		}),
		columnHelper.accessor('warehouses_count', { header: 'Tovar soni', size: 130 }),
		columnHelper.accessor('clients_count', { header: 'Mijoz soni', size: 110 }),
		columnHelper.accessor('total_count', { header: 'Jami', size: 90 }),
		columnHelper.accessor('sent_count', {
			header: 'Yuborilgan',
			size: 100,
			cell: (info) => <span className='font-semibold text-ca-green'>{info.getValue()}</span>,
		}),
		columnHelper.accessor('error_count', {
			header: 'Xato',
			size: 80,
			cell: (info) => <span className='font-semibold text-ca-red'>{info.getValue()}</span>,
		}),
		columnHelper.accessor('status', {
			header: 'Status',
			size: 130,
			cell: (info) => <BroadcastStatusBadge status={info.getValue()} />,
		}),
		columnHelper.accessor('created_time', {
			header: 'Yaratilgan vaqt',
			size: 140,
			cell: (info) => formatDateTime(info.getValue()),
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			size: 100,
			cell: ({ row }) => (
				<div className='flex justify-end'>
					<Button
						type='button'
						variant='info'
						size='icon'
						aria-label="Ko'rish"
						onClick={() => navigate(`/telegram-broadcast/${row.original.id}`)}
					>
						<FaEye />
					</Button>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Telegram xabarnomalar'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Telegram xabarnomalar', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					<Button
						type='button'
						variant='info'
						size='xs'
						onClick={() => navigate('/telegram-broadcast/create')}
					>
						<FaPaperPlane className='mr-1.5' /> Yangi xabarnoma
					</Button>
				}
				onReload={() => refetch()}
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
					enableColumnFilters={false}
					enableStriping
					isLoading={isLoading || isFetching}
					emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : "Ma'lumot topilmadi"}
					emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
				/>
			</Panel>
		</>
	);
}

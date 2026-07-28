import { createColumnHelper, type PaginationState } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import {
	Button,
	buttonProps,
	DataTable,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import {
	useClearOrderCartMutation,
	useDeleteOrderCartMutation,
	useOrderCartGroupedListQuery,
} from '@/services/order-cart/order-cart.queries';
import type { OrderCartItem } from '@/services/order-cart/order-cart.types';

const DEFAULT_LOCATION_LABEL = 'Dokon';

type GroupedCartItem = OrderCartItem & {
	_groupId: number;
	_clientId: number;
	_clientFio: string;
	_createdTime: string;
	_dateLabel: string;
	_companyId?: number;
	_groupTotalCount: number;
	_groupTotalSum: number;
};

const columnHelper = createColumnHelper<GroupedCartItem>();

interface GroupToDelete {
	clientId: number;
	companyId: number;
	clientFio: string;
}

interface OrderCartDraftTabProps {
	onRefetchReady?: (refetch: () => void) => void;
}

export default function OrderCartDraftTab({ onRefetchReady }: OrderCartDraftTabProps) {
	const { notify } = useNotification();
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

	const { data, isLoading, isFetching, isError, refetch } = useOrderCartGroupedListQuery({
		is_active: true,
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
	});
	const deleteItemMutation = useDeleteOrderCartMutation();
	const clearGroupMutation = useClearOrderCartMutation();
	const [groupToDelete, setGroupToDelete] = useState<GroupToDelete | null>(null);

	useEffect(() => {
		onRefetchReady?.(refetch);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refetch]);

	const paginationMeta = data?.pagination;

	const results: GroupedCartItem[] = useMemo(
		() =>
			(data?.results.groups ?? []).flatMap((group, groupIndex) => {
				const totalCount = group.items.reduce((sum, item) => sum + item.count, 0);
				const totalSum = group.items.reduce(
					(sum, item) => sum + (Number(item.total_price) || item.count * Number(item.price)),
					0,
				);
				return group.items.map((item) => ({
					...item,
					_groupId: groupIndex,
					_clientId: group.client_id,
					_clientFio: group.client_fio,
					_createdTime: group.created_time,
					_dateLabel: new Date(group.created_time).toLocaleDateString('ru-RU'),
					_companyId: item.company,
					_groupTotalCount: totalCount,
					_groupTotalSum: totalSum,
				}));
			}),
		[data],
	);

	function handleRemoveItem(id: number) {
		deleteItemMutation.mutate(id);
	}

	async function handleConfirmGroupDelete() {
		if (!groupToDelete) return;
		try {
			await clearGroupMutation.mutateAsync({
				company: groupToDelete.companyId,
				client: groupToDelete.clientId,
			});
			notify({ title: "Karzinka o'chirildi" });
			setGroupToDelete(null);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, "O'chirishda xatolik yuz berdi") });
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
		columnHelper.display({
			id: 'client',
			header: 'Mijoz',
			size: 190,
			cell: ({ row }) => {
				const item = row.original;
				return (
					<div className='flex items-center justify-between gap-2'>
						<div>
							<div className='font-semibold text-ca-heading'>{item._clientFio}</div>
							<div className='mt-1 text-[11px] font-semibold text-ca-text'>
								Jami: {formatNumber(item._groupTotalCount)} dona / {formatNumber(item._groupTotalSum, 2)} $
							</div>
						</div>
						<Button
							type='button'
							{...buttonProps(<FaTrash />, 'danger', 'icon')}
							aria-label="Karzinkani o'chirish"
							disabled={!item._companyId}
							onClick={() =>
								item._companyId &&
								setGroupToDelete({
									clientId: item._clientId,
									companyId: item._companyId,
									clientFio: item._clientFio,
								})
							}
						/>
					</div>
				);
			},
			meta: {
				rowSpanGroupKey: (row) => row._groupId,
			},
		}),
		columnHelper.display({
			id: 'location',
			header: 'Joy',
			cell: ({ row }) => row.original.warehouse_detail?.type_sklad_name ?? DEFAULT_LOCATION_LABEL,
		}),
		columnHelper.display({
			id: 'brand',
			header: 'Model',
			cell: ({ row }) => row.original.warehouse_detail?.brand_name ?? '-',
		}),
		columnHelper.display({
			id: 'category',
			header: 'Nomi',
			cell: ({ row }) => row.original.warehouse_detail?.product_category_name ?? '-',
		}),
		columnHelper.display({
			id: 'size',
			header: "O'lcham",
			cell: ({ row }) => formatNumber(row.original.warehouse_detail?.size ?? ''),
		}),
		columnHelper.display({
			id: 'type',
			header: 'Tip',
			cell: ({ row }) => row.original.warehouse_detail?.type_name ?? '',
		}),
		columnHelper.accessor('price', {
			header: 'Narxi ($)',
			cell: (info) => <span className='font-semibold text-ca-green'>{formatNumber(info.getValue(), 2)} $</span>,
		}),
		columnHelper.accessor('count', {
			header: 'Soni',
			cell: (info) => formatNumber(info.getValue()),
		}),
		columnHelper.display({
			id: 'total_price',
			header: 'Umum. narxi ($)',
			cell: ({ row }) => {
				const item = row.original;
				const totalPrice = Number(item.total_price) || item.count * Number(item.price);
				return <span className='font-semibold'>{formatNumber(totalPrice, 2)} $</span>;
			},
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			cell: ({ row }) => (
				<div className='flex justify-end'>
					<Button
						type='button'
						{...buttonProps(<FaTrash />, 'danger', 'icon')}
						aria-label="O'chirish"
						onClick={() => handleRemoveItem(row.original.id)}
					/>
				</div>
			),
		}),
	];

	return (
		<div>
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
				columnVisibilityKey='order-cart-draft'
				enableStriping
				isLoading={isLoading || isFetching}
				emptyMessage={isError ? 'Xatolik yuz berdi' : "Karzinkalar bo'sh"}
				emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
			/>

			<Modal open={Boolean(groupToDelete)} onOpenChange={(open) => !open && setGroupToDelete(null)}>
				<ModalContent>
					<ModalHeader>
						<ModalTitle>O'chirishni tasdiqlang</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>
							<span className='font-semibold'>{groupToDelete?.clientFio}</span> mijozning karzinkasidagi
							barcha mahsulotlarni o'chirmoqchimisiz?
						</p>
					</ModalBody>
					<ModalFooter>
						<Button variant='white' onClick={() => setGroupToDelete(null)}>
							Yo'q
						</Button>
						<Button
							variant='danger'
							onClick={handleConfirmGroupDelete}
							disabled={clearGroupMutation.isPending}
						>
							Ha, o'chirish
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	);
}

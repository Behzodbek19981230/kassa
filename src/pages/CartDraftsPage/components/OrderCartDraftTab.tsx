import { Fragment, useEffect, useState } from 'react';
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import {
	Button,
	buttonProps,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	Pagination,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	useNotification,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import {
	useClearOrderCartMutation,
	useDeleteOrderCartMutation,
	useOrderCartGroupedListQuery,
} from '@/services/order-cart/order-cart.queries';

const DEFAULT_LOCATION_LABEL = 'Dokon';
const COLUMN_COUNT = 8;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

interface GroupToDelete {
	clientId: number;
	companyId: number;
	clientFio: string;
}

interface OrderCartDraftTabProps {
	onRefetchReady?: (refetch: () => void) => void;
}

function formatDate(value: string) {
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('ru-RU');
}

export default function OrderCartDraftTab({ onRefetchReady }: OrderCartDraftTabProps) {
	const { canWrite } = useCurrentCompany();
	const { notify } = useNotification();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

	const { data, isLoading, isFetching, isError, refetch } = useOrderCartGroupedListQuery({
		is_active: true,
		page,
		limit: pageSize,
	});
	const deleteItemMutation = useDeleteOrderCartMutation();
	const clearGroupMutation = useClearOrderCartMutation();
	const [groupToDelete, setGroupToDelete] = useState<GroupToDelete | null>(null);

	useEffect(() => {
		onRefetchReady?.(refetch);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refetch]);

	const groups = data?.results.groups ?? [];
	const paginationMeta = data?.pagination;
	const totalRows = paginationMeta?.total ?? 0;
	const totalPages = paginationMeta?.lastPage ?? 1;
	const start = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
	const end = Math.min(page * pageSize, totalRows);

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

	return (
		<div>
			<div className='mb-2.5 flex items-center gap-2 text-xs'>
				<Select
					value={String(pageSize)}
					onValueChange={(value) => {
						setPageSize(Number(value));
						setPage(1);
					}}
				>
					<SelectTrigger className='h-[30px] w-[70px]'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{PAGE_SIZE_OPTIONS.map((size) => (
							<SelectItem key={size} value={String(size)}>
								{size}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className='overflow-x-auto'>
				<Table className='min-w-[720px] rounded-[3px] border border-ca-border'>
					<TableHeader>
						<TableRow>
							<TableHead className='bg-ca-theme text-white'>Joy</TableHead>
							<TableHead className='bg-ca-theme text-white'>Model</TableHead>
							<TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
							<TableHead className='bg-ca-theme text-white'>O'lcham</TableHead>
							<TableHead className='bg-ca-theme text-white'>Tip</TableHead>
							<TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>
							<TableHead className='bg-ca-theme text-white'>Soni</TableHead>
							<TableHead className='bg-ca-theme text-white'>Umum. narxi ($)</TableHead>
							<TableHead className='bg-ca-theme text-white' />
						</TableRow>
					</TableHeader>
					<TableBody>
						{(isLoading || isFetching) && (
							<TableRow>
								<TableCell colSpan={COLUMN_COUNT + 1} className='text-center'>
									Yuklanmoqda...
								</TableCell>
							</TableRow>
						)}
						{!isLoading && isError && (
							<TableRow>
								<TableCell colSpan={COLUMN_COUNT + 1} className='text-center text-ca-red'>
									<FaExclamationTriangle className='mr-1.5 inline' /> Xatolik yuz berdi
								</TableCell>
							</TableRow>
						)}
						{!isLoading && !isFetching && !isError && groups.length === 0 && (
							<TableRow>
								<TableCell colSpan={COLUMN_COUNT + 1} className='text-center'>
									Karzinkalar bo'sh
								</TableCell>
							</TableRow>
						)}
						{!isLoading &&
							!isFetching &&
							!isError &&
							groups.map((group, groupIndex) => {
								const totalCount = group.items.reduce((sum, item) => sum + item.count, 0);
								const totalSum = group.items.reduce(
									(sum, item) => sum + (Number(item.total_price) || item.count * Number(item.price)),
									0,
								);
								const companyId = group.items[0]?.company;
								return (
									<Fragment key={`${group.client_id}-${groupIndex}`}>
										<TableRow>
											<TableCell colSpan={COLUMN_COUNT + 1} className='bg-cyan-100 p-0'>
												<div className='flex flex-wrap items-center justify-between gap-2 px-3 py-2'>
													<div className='flex flex-wrap items-center gap-x-5 gap-y-1'>
														<span className='font-bold text-ca-red'>
															Sana: {formatDate(group.created_time)}
														</span>
														<span className='font-bold text-ca-red'>
															Mijoz: {group.client_fio}
														</span>
														<span className='text-xs font-semibold text-ca-heading'>
															Jami: {formatNumber(totalCount)} dona /{' '}
															{formatNumber(totalSum, 2)} $
														</span>
													</div>
													<Button
														type='button'
														{...buttonProps(<FaTrash />, 'danger', 'icon')}
														aria-label="Karzinkani o'chirish"
														disabled={!companyId || !canWrite}
														onClick={() =>
															companyId &&
															setGroupToDelete({
																clientId: group.client_id,
																companyId,
																clientFio: group.client_fio,
															})
														}
													/>
												</div>
											</TableCell>
										</TableRow>
										{group.items.map((item) => {
											const totalPrice = Number(item.total_price) || item.count * Number(item.price);
											return (
												<TableRow key={item.id} className='bg-red-50'>
													<TableCell>
														{item.warehouse_detail?.type_sklad_name ?? DEFAULT_LOCATION_LABEL}
													</TableCell>
													<TableCell>{item.warehouse_detail?.brand_name ?? '-'}</TableCell>
													<TableCell>
														{item.warehouse_detail?.product_category_name ?? '-'}
													</TableCell>
													<TableCell>{formatNumber(item.warehouse_detail?.size ?? '')}</TableCell>
													<TableCell>{item.warehouse_detail?.type_name ?? ''}</TableCell>
													<TableCell className='font-semibold text-ca-green'>
														{formatNumber(item.price, 2)} $
													</TableCell>
													<TableCell>{formatNumber(item.count)}</TableCell>
													<TableCell className='font-semibold'>
														{formatNumber(totalPrice, 2)} $
													</TableCell>
													<TableCell>
														<div className='flex justify-end'>
															<Button
																type='button'
																{...buttonProps(<FaTrash />, 'danger', 'icon')}
																aria-label="O'chirish"
																disabled={!canWrite}
																onClick={() => handleRemoveItem(item.id)}
															/>
														</div>
													</TableCell>
												</TableRow>
											);
										})}
									</Fragment>
								);
							})}
					</TableBody>
				</Table>
			</div>

			{totalRows > 0 && (
				<div className='mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs'>
					<div>
						Showing {start} to {end} of {totalRows} entries
					</div>
					<Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
				</div>
			)}

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
							disabled={clearGroupMutation.isPending || !canWrite}
						>
							Ha, o'chirish
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	);
}

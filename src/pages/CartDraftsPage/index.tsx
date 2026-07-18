import { useState } from 'react';
import { FaArrowLeft, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
	Button,
	buttonProps,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	PageHeader,
	Panel,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import {
	useClearOrderCartMutation,
	useDeleteOrderCartMutation,
	useOrderCartGroupedListQuery,
} from '@/services/order-cart/order-cart.queries';

const DEFAULT_LOCATION_LABEL = 'Dokon';

function formatDateTime(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	const date = d.toLocaleDateString('ru-RU');
	const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	return `${date} ${time}`;
}

interface GroupToDelete {
	clientId: number;
	companyId: number;
	clientFio: string;
}

export default function CartDraftsPage() {
	const navigate = useNavigate();
	const { notify } = useNotification();
	const { data, isLoading, isFetching, isError, refetch } = useOrderCartGroupedListQuery({
		is_active: true,
		limit: 100,
	});
	const deleteItemMutation = useDeleteOrderCartMutation();
	const clearGroupMutation = useClearOrderCartMutation();
	const [groupToDelete, setGroupToDelete] = useState<GroupToDelete | null>(null);

	const groups = data?.results.groups ?? [];

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
			notify({ title: 'Karzinka o\'chirildi' });
			setGroupToDelete(null);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, "O'chirishda xatolik yuz berdi") });
		}
	}

	return (
		<>
			<PageHeader
				title='Karzinkalar (draft buyurtmalar)'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Mijoz buyurmalari tarixi', path: '/customer-order-history' },
					{ label: 'Karzinkalar', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					<Button type='button' variant='info' size='xs' onClick={() => navigate(-1)}>
						<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
					</Button>
				}
				onReload={() => refetch()}
			>
				{(isLoading || isFetching) && <p className='text-center'>Yuklanmoqda...</p>}
				{!isLoading && isError && (
					<p className='text-center text-ca-red'>
						<FaExclamationTriangle className='mr-1.5 inline' /> Xatolik yuz berdi
					</p>
				)}
				{!isLoading && !isError && groups.length === 0 && (
					<p className='text-center'>Karzinkalar bo'sh</p>
				)}
				{!isLoading &&
					!isError &&
					groups.map((group) => {
						const totalCount = group.items.reduce((sum, item) => sum + item.count, 0);
						const totalSum = group.items.reduce(
							(sum, item) => sum + (Number(item.total_price) || item.count * Number(item.price)),
							0,
						);
						const companyId = group.items[0]?.company;
						return (
							<div
								key={group.client_id}
								className='mb-6 overflow-hidden rounded-[3px] border border-ca-border last:mb-0'
							>
								<div className='flex flex-wrap items-center justify-between gap-2 bg-ca-silver px-3 py-2'>
									<span className='text-xs font-semibold text-ca-heading'>
										{group.client_fio}{' '}
										<span className='font-normal text-ca-text'>
											({formatDateTime(group.created_time)})
										</span>
									</span>
									<Button
										type='button'
										{...buttonProps(<FaTrash />, 'danger', 'icon')}
										aria-label="Karzinkani o'chirish"
										disabled={!companyId}
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
								<div className='overflow-x-auto'>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className='bg-ca-theme text-white'>#</TableHead>
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
											{group.items.length === 0 && (
												<TableRow>
													<TableCell colSpan={10} className='text-center'>
														Mahsulot yo'q
													</TableCell>
												</TableRow>
											)}
											{group.items.map((item, index) => {
												const totalPrice =
													Number(item.total_price) || item.count * Number(item.price);
												return (
													<TableRow key={item.id} className='bg-red-50'>
														<TableCell>{index + 1}</TableCell>
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
															<Button
																type='button'
																{...buttonProps(<FaTrash />, 'danger', 'icon')}
																aria-label="O'chirish"
																onClick={() => handleRemoveItem(item.id)}
															/>
														</TableCell>
													</TableRow>
												);
											})}
											{group.items.length > 0 && (
												<TableRow className='bg-ca-heading'>
													<TableCell className='bg-ca-heading text-white' colSpan={7}>
														Jami
													</TableCell>
													<TableCell className='bg-ca-heading font-semibold text-white'>
														{formatNumber(totalCount)}
													</TableCell>
													<TableCell className='bg-ca-heading font-semibold text-white'>
														{formatNumber(totalSum, 2)} $
													</TableCell>
													<TableCell className='bg-ca-heading' />
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>
							</div>
						);
					})}
			</Panel>

			<Modal open={Boolean(groupToDelete)} onOpenChange={(open) => !open && setGroupToDelete(null)}>
				<ModalContent>
					<ModalHeader>
						<ModalTitle>O'chirishni tasdiqlang</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>
							<span className='font-semibold'>{groupToDelete?.clientFio}</span> mijozning
							karzinkasidagi barcha mahsulotlarni o'chirmoqchimisiz?
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
		</>
	);
}

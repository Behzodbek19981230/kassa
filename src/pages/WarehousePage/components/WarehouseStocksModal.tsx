import { FaSpinner } from 'react-icons/fa';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { useSkladProductListQuery } from '@/services/sklad-product/sklad-product.queries';

interface WarehouseStocksModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	/** The product card whose stock in every sklad is shown. */
	warehouseId: number;
	productLabel: string;
}

export default function WarehouseStocksModal({ open, setOpen, warehouseId, productLabel }: WarehouseStocksModalProps) {
	const { data, isLoading, isError } = useSkladProductListQuery({ warehouse: warehouseId, limit: 100 });
	const stocks = data?.results ?? [];

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>
						<span className='font-bold text-ca-red'>{productLabel}</span>{' '}
						<span className='text-ca-text'>skladlar bo'yicha</span>
					</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{isLoading ? (
						<div className='flex justify-center py-4 text-ca-text'>
							<FaSpinner className='animate-spin' />
						</div>
					) : isError ? (
						<p className='text-xs text-ca-red'>Ma'lumotni yuklashda xatolik yuz berdi</p>
					) : stocks.length === 0 ? (
						<p className='text-xs text-ca-text'>Bu tovar hech qaysi skladda yo'q</p>
					) : (
						<ul className='flex flex-col gap-2 text-xs'>
							{stocks.map((stock) => (
								<li key={stock.id} className='rounded-[3px] bg-ca-silver px-3 py-2'>
									<span className='font-bold text-ca-heading'>
										{stock.type_sklad_detail?.name ?? `#${stock.type_sklad}`}
									</span>
									<span className='ml-2 text-ca-text'>
										Soni: <span className='font-semibold text-ca-heading'>{formatNumber(stock.count)}</span>,
										Haqiqiy narx:{' '}
										<span className='font-semibold text-ca-heading'>
											{formatNumber(stock.real_price ?? 0, 2)} $
										</span>
										, Ishchi uchun narx:{' '}
										<span className='font-semibold text-ca-heading'>
											{formatNumber(stock.worker_price ?? 0, 2)} $
										</span>
									</span>
								</li>
							))}
						</ul>
					)}
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Yopish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

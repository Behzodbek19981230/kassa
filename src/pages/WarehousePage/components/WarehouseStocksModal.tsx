import { FaSpinner } from 'react-icons/fa';
import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { usePermissions } from '@/lib/permissions';
import { useSkladProductListQuery } from '@/services/sklad-product/sklad-product.queries';

interface WarehouseStocksModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	/** The product card whose stock in every sklad is shown. */
	warehouseId: number;
	productLabel: string;
}

export default function WarehouseStocksModal({ open, setOpen, warehouseId, productLabel }: WarehouseStocksModalProps) {
	const { isSuperAdmin } = usePermissions();
	const { data, isLoading, isError } = useSkladProductListQuery({ warehouse: warehouseId, limit: 100 });
	const stocks = data?.results ?? [];

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-2xl'>
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
						<div className='overflow-hidden rounded-lg border border-ca-border'>
						<Table className='text-sm'>
							<TableHeader>
								<TableRow className='bg-ca-silver'>
									<TableHead className='py-3'>Sklad</TableHead>
									<TableHead className='py-3 text-center'>Soni</TableHead>
									{isSuperAdmin && <TableHead className='py-3 text-right'>Haqiqiy narx</TableHead>}
									<TableHead className='py-3 text-right'>Ishchi uchun narx</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{stocks.map((stock) => (
									<TableRow key={stock.id}>
										<TableCell className='py-3 text-base font-bold text-ca-heading'>
											{stock.type_sklad_detail?.name ?? `#${stock.type_sklad}`}
										</TableCell>
										<TableCell className='py-3 text-center'>
											<span className='inline-block min-w-10 rounded-md border border-ca-theme/30 bg-ca-theme/15 px-3 py-1 font-semibold text-ca-theme'>
												{formatNumber(stock.count)}
											</span>
										</TableCell>
										{isSuperAdmin && (
											<TableCell className='py-3 text-right font-semibold text-ca-heading'>{formatNumber(stock.real_price ?? 0, 2)} $</TableCell>
										)}
										<TableCell className='py-3 text-right font-semibold text-ca-heading'>{formatNumber(stock.worker_price ?? 0, 2)} $</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						</div>
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

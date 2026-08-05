import { useState } from 'react';
import { FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import {
	Badge,
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
	useNotification,
} from '@/components/ui';
import { loadBlobIntoTab, openPendingTab } from '@/lib/blob';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { warehouseTransferService } from '@/services/warehouse-transfer/warehouse-transfer.service';
import { useWarehouseTransferDispatchListQuery } from '@/services/warehouse-transfer/warehouse-transfer.queries';

interface DispatchListModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	transferId: number;
}

export default function DispatchListModal({ open, setOpen, transferId }: DispatchListModalProps) {
	const { notify } = useNotification();
	const [isPrinting, setIsPrinting] = useState(false);

	const { data, isLoading, isError, error } = useWarehouseTransferDispatchListQuery(transferId);

	async function handlePrint() {
		const tab = openPendingTab();
		setIsPrinting(true);
		try {
			const blob = await warehouseTransferService.printDispatchList(transferId);
			loadBlobIntoTab(blob, tab);
		} catch {
			tab?.close();
			notify({ title: 'Xatolik', text: "PDF yuklab bo'lmadi" });
		} finally {
			setIsPrinting(false);
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-[720px]'>
				<ModalHeader>
					<ModalTitle>
						#{transferId} transfer: tayyorlab dostavkaga chiqarish ro'yxati
					</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{isLoading && <div className='py-4 text-center text-ca-text'>Yuklanmoqda...</div>}

					{isError && (
						<div className='flex items-center justify-center gap-2 py-4 text-ca-red'>
							<FaExclamationTriangle /> {getApiErrorMessage(error, 'Xatolik yuz berdi')}
						</div>
					)}

					{data && (
						<>
							<div className='mb-3 flex flex-wrap items-center gap-x-5 gap-y-1.5'>
								<span className='text-xs'>
									<span className='font-semibold text-ca-heading'>Qayerdan:</span>{' '}
									<span className='font-bold text-ca-orange'>{data.from_type_sklad.name}</span>
								</span>
								<span className='text-xs'>
									<span className='font-semibold text-ca-heading'>Qayerga:</span>{' '}
									<span className='font-bold text-ca-heading'>{data.to_type_sklad.name}</span>
								</span>
								<span className='text-xs'>
									<span className='font-semibold text-ca-heading'>Holati:</span>{' '}
									<Badge variant={data.is_confirmed ? 'success' : 'default'}>
										{data.is_confirmed ? 'Bajarildi' : 'Jarayonda'}
									</Badge>
								</span>
							</div>

							<div className='overflow-x-auto rounded-[3px] border border-ca-border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Sklad turi</TableHead>
											<TableHead>Brand</TableHead>
											<TableHead>Mahsulot turi</TableHead>
											<TableHead>Transfer miqdori</TableHead>
											<TableHead>Tip</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data.items.length === 0 ? (
											<TableRow>
												<TableCell colSpan={5} className='text-center text-ca-text'>
													Mahsulotlar topilmadi
												</TableCell>
											</TableRow>
										) : (
											data.items.map((item, index) => (
												<TableRow key={`${item.brand.id}-${item.product_category.id}-${index}`}>
													<TableCell>{item.type_sklad.name}</TableCell>
													<TableCell>{item.brand.name}</TableCell>
													<TableCell>{item.product_category.name}</TableCell>
													<TableCell className='font-semibold text-ca-heading'>
														{formatNumber(item.transfer_quantity)}
													</TableCell>
													<TableCell>{item.type.name}</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
						</>
					)}
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Yopish
					</Button>
					<Button type='button' variant='warning' disabled={isPrinting} onClick={handlePrint}>
						<FaDownload className='mr-1.5' /> {isPrinting ? 'Yuklanmoqda...' : 'PDF chop qilish'}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

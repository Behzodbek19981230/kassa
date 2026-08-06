import { useState } from 'react';
import { FaArrowLeft, FaDownload, FaExclamationTriangle, FaUndo } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import {
	Badge,
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	useNotification,
} from '@/components/ui';
import { loadBlobIntoTab, openPendingTab } from '@/lib/blob';
import { useCurrentCompany } from '@/lib/company';
import { formatNumber } from '@/lib/number';
import { warehouseTransferService } from '@/services/warehouse-transfer/warehouse-transfer.service';
import { useWarehouseTransferQuery } from '@/services/warehouse-transfer/warehouse-transfer.queries';
import ReverseTransferModal from '@/pages/WarehouseTransferDetailPage/components/ReverseTransferModal';

const MODE_LABEL: Record<string, string> = {
	same: "O'z holicha",
	spread: 'Yoyib',
};

export default function WarehouseTransferDetailPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const transferId = id ? Number(id) : undefined;
	const { notify } = useNotification();
	const { canWrite } = useCurrentCompany();

	const { data, isLoading, isError } = useWarehouseTransferQuery(transferId);
	const [isPrinting, setIsPrinting] = useState(false);
	const [reverseOpen, setReverseOpen] = useState(false);

	async function handlePrint() {
		if (!transferId) return;
		const tab = openPendingTab();
		setIsPrinting(true);
		try {
			const blob = await warehouseTransferService.print(transferId);
			loadBlobIntoTab(blob, tab);
		} catch {
			tab?.close();
			notify({ title: 'Xatolik', text: "PDF yuklab bo'lmadi" });
		} finally {
			setIsPrinting(false);
		}
	}

	if (isLoading) {
		return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
	}

	if (isError || !data) {
		return (
			<div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
				<FaExclamationTriangle /> Transfer topilmadi
			</div>
		);
	}

	return (
		<>
			<div className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-ca-theme px-4 py-3 text-white'>
				<h4 className='text-sm font-normal'>
					#{data.id} transfer:{' '}
					<span className='font-semibold'>
						{data.from_type_sklad_detail?.name} → {data.to_type_sklad_detail?.name}
					</span>
				</h4>
				<div className='flex flex-wrap items-center gap-2'>
					<Button type='button' variant='info' size='xs' onClick={() => navigate(-1)}>
						<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
					</Button>
					<Button type='button' variant='warning' size='xs' disabled={isPrinting} onClick={handlePrint}>
						<FaDownload className='mr-1.5' /> {isPrinting ? 'Yuklanmoqda...' : 'Chop qilish'}
					</Button>
				</div>
			</div>

			<div className='mb-5 rounded-[3px] bg-white p-5 shadow-sm'>
				<h4 className='mb-4 text-sm font-semibold text-ca-heading'>Hisobot</h4>

				<div className='-mx-2.5 flex flex-wrap gap-y-3 text-xs'>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>Sana:</span>{' '}
						<span className='font-bold text-ca-orange'>
							{new Date(data.created_time).toLocaleString('uz-UZ', {
								dateStyle: 'short',
								timeStyle: 'short',
							})}
						</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-heading'>Holati:</span>{' '}
						<Badge variant={data.is_confirmed ? 'success' : 'default'}>
							{data.is_confirmed ? 'Bajarildi' : 'Jarayonda'}
						</Badge>
					</div>

					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>Qayerdan:</span>{' '}
						<span className='font-bold text-ca-orange'>{data.from_type_sklad_detail?.name}</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-heading'>Qayerga:</span>{' '}
						<span className='font-bold text-ca-heading'>{data.to_type_sklad_detail?.name}</span>
					</div>

					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-orange'>Tovarlar soni:</span>{' '}
						<span className='font-bold text-ca-orange'>{data.items_count}</span>
					</div>
					<div className='w-full px-2.5 sm:w-1/2'>
						<span className='font-semibold text-ca-heading'>Foydalanuvchi:</span>{' '}
						<span className='font-bold text-ca-heading'>
							{data.created_by_detail
								? `${data.created_by_detail.last_name} ${data.created_by_detail.first_name}`.trim() ||
									data.created_by_detail.username
								: ''}
						</span>
					</div>

					{data.note && (
						<div className='w-full px-2.5'>
							<span className='font-semibold text-ca-orange'>Izoh:</span>{' '}
							<span className='font-bold text-ca-heading'>{data.note}</span>
						</div>
					)}
				</div>
			</div>

			<div className='overflow-x-auto rounded-[3px] bg-white shadow-sm'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='bg-ca-theme text-white'>#</TableHead>
							<TableHead className='bg-ca-theme text-white'>Usul</TableHead>
							<TableHead className='bg-ca-theme text-white'>Transfer qilingan tovar</TableHead>
							<TableHead className='bg-ca-theme text-white'>Miqdor</TableHead>
							<TableHead className='bg-ca-theme text-white'>Qabul qilingan tovar</TableHead>
							<TableHead className='bg-ca-theme text-white'>Miqdor</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className='text-center text-ca-text'>
									Mahsulotlar topilmadi
								</TableCell>
							</TableRow>
						) : (
							data.items.map((item, index) => {
								const source = item.source_snapshot;
								const target = item.target_snapshot;
								return (
									<TableRow key={item.id}>
										<TableCell>{index + 1}</TableCell>
										<TableCell>{MODE_LABEL[item.mode] ?? item.mode}</TableCell>
										<TableCell className='font-semibold text-ca-red'>
											{source.type_sklad_name} / {source.brand_name} /{' '}
											{source.product_category_name} / {formatNumber(source.size)} /{' '}
											{source.type_name}
										</TableCell>
										<TableCell className='font-semibold text-ca-red'>
											-{formatNumber(item.source_quantity)}
										</TableCell>
										<TableCell className='font-semibold text-ca-green'>
											{target.type_sklad_name} / {target.brand_name} /{' '}
											{target.product_category_name} / {formatNumber(target.size)} /{' '}
											{target.type_name}
										</TableCell>
										<TableCell className='font-semibold text-ca-green'>
											+{formatNumber(item.target_quantity)}
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			{reverseOpen && (
				<ReverseTransferModal
					open={reverseOpen}
					setOpen={setReverseOpen}
					transfer={data}
					onReversed={() => navigate('/warehouse-transfer')}
				/>
			)}
		</>
	);
}

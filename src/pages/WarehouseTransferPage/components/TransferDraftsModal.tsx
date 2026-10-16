import { useState } from 'react';
import { FaEdit, FaPaperPlane, FaTrash } from 'react-icons/fa';
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
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { warehouseTransferService } from '@/services/warehouse-transfer/warehouse-transfer.service';
import {
	useDeleteWarehouseTransferDraftMutation,
	useSendWarehouseTransferDraftMutation,
	useWarehouseTransferDraftListQuery,
} from '@/services/warehouse-transfer/warehouse-transfer.queries';
import type { WarehouseTransferDetail } from '@/services/warehouse-transfer/warehouse-transfer.types';

interface TransferDraftsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onContinue: (draft: WarehouseTransferDetail) => void;
	onDraftGone: (id: number) => void;
	canWrite: boolean;
}

function formatTime(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ru-RU');
}

export default function TransferDraftsModal({
	open,
	onOpenChange,
	onContinue,
	onDraftGone,
	canWrite,
}: TransferDraftsModalProps) {
	const { notify } = useNotification();
	const { data, isLoading, isError, error, refetch } = useWarehouseTransferDraftListQuery(open);
	const sendMutation = useSendWarehouseTransferDraftMutation();
	const deleteMutation = useDeleteWarehouseTransferDraftMutation();
	const [busyId, setBusyId] = useState<number | null>(null);
	const drafts = data?.results ?? [];

	// 410: the draft expired and the backend already removed it and released the reserve.
	function handleError(err: unknown, id: number, fallback: string) {
		const status = (err as { response?: { status?: number } })?.response?.status;
		if (status === 410 || status === 404) {
			onDraftGone(id);
			refetch();
			notify({ title: 'Karzinka muddati tugagan', text: "Karzinka o'chirilgan, qoldiq qaytarildi" });
			return;
		}
		notify({ title: 'Xatolik', text: getApiErrorMessage(err, fallback) });
	}

	async function handleContinue(id: number) {
		setBusyId(id);
		try {
			onContinue(await warehouseTransferService.getDraft(id));
			onOpenChange(false);
		} catch (err) {
			handleError(err, id, 'Karzinkani yuklashda xatolik yuz berdi');
		} finally {
			setBusyId(null);
		}
	}

	async function handleSend(id: number) {
		setBusyId(id);
		try {
			await sendMutation.mutateAsync(id);
			onDraftGone(id);
			notify({ title: 'Transfer amalga oshirildi' });
		} catch (err) {
			handleError(err, id, 'Transferni yuborishda xatolik yuz berdi');
		} finally {
			setBusyId(null);
		}
	}

	async function handleDelete(id: number) {
		setBusyId(id);
		try {
			await deleteMutation.mutateAsync(id);
			onDraftGone(id);
			notify({ title: "Karzinka o'chirildi" });
		} catch (err) {
			handleError(err, id, "Karzinkani o'chirishda xatolik yuz berdi");
		} finally {
			setBusyId(null);
		}
	}

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Saqlangan karzinkalar</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p className='mb-3 text-xs text-ca-text'>
						Saqlangan karzinka tovarni vaqtincha band qiladi. Yuborilmasa, 1 soatdan keyin avtomatik o'chiriladi.
					</p>
					<div className='max-h-[60vh] overflow-auto'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='bg-ca-theme text-white'>#</TableHead>
									<TableHead className='bg-ca-theme text-white'>Sklad</TableHead>
									<TableHead className='bg-ca-theme text-white'>Pozitsiya</TableHead>
									<TableHead className='bg-ca-theme text-white'>Vaqt</TableHead>
									<TableHead className='bg-ca-theme text-white' />
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading && (
									<TableRow>
										<TableCell colSpan={5} className='text-center'>
											Yuklanmoqda...
										</TableCell>
									</TableRow>
								)}
								{isError && (
									<TableRow>
										<TableCell colSpan={5} className='text-center text-ca-red'>
											{getApiErrorMessage(error, 'Xatolik yuz berdi')}
										</TableCell>
									</TableRow>
								)}
								{!isLoading && !isError && drafts.length === 0 && (
									<TableRow>
										<TableCell colSpan={5} className='text-center'>
											Saqlangan karzinka yo'q
										</TableCell>
									</TableRow>
								)}
								{drafts.map((draft) => (
									<TableRow key={draft.id}>
										<TableCell>{draft.id}</TableCell>
										<TableCell>
											{draft.from_type_sklad_detail?.name ?? draft.from_type_sklad} →{' '}
											{draft.to_type_sklad_detail?.name ?? draft.to_type_sklad}
										</TableCell>
										<TableCell>{formatNumber(draft.items_count)}</TableCell>
										<TableCell>{formatTime(draft.created_time)}</TableCell>
										<TableCell>
											<div className='flex gap-1'>
												<Button
													type='button'
													variant='theme'
													size='icon'
													aria-label='Davom ettirish'
													disabled={!canWrite || busyId !== null}
													onClick={() => handleContinue(draft.id)}
												>
													<FaEdit />
												</Button>
												<Button
													type='button'
													variant='warning'
													size='icon'
													aria-label='Yuborish'
													disabled={!canWrite || busyId !== null}
													loading={busyId === draft.id && sendMutation.isPending}
													onClick={() => handleSend(draft.id)}
												>
													<FaPaperPlane />
												</Button>
												<Button
													type='button'
													variant='danger'
													size='icon'
													aria-label="O'chirish"
													disabled={!canWrite || busyId !== null}
													loading={busyId === draft.id && deleteMutation.isPending}
													onClick={() => handleDelete(draft.id)}
												>
													<FaTrash />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => onOpenChange(false)}>
						Yopish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

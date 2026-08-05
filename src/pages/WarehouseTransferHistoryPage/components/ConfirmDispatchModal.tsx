import { useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import {
	Button,
	FormField,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	Textarea,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { useConfirmWarehouseTransferMutation } from '@/services/warehouse-transfer/warehouse-transfer.queries';
import type { WarehouseTransfer } from '@/services/warehouse-transfer/warehouse-transfer.types';

interface ConfirmDispatchModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	transfer: WarehouseTransfer;
	onConfirmed: () => void;
}

export default function ConfirmDispatchModal({ open, setOpen, transfer, onConfirmed }: ConfirmDispatchModalProps) {
	const { notify } = useNotification();
	const [note, setNote] = useState('Yuk tayyorlanib chiqib ketdi');
	const confirmMutation = useConfirmWarehouseTransferMutation();

	async function handleConfirm() {
		try {
			await confirmMutation.mutateAsync({
				id: transfer.id,
				payload: { is_confirmed: true, confirmation_note: note.trim() || undefined },
			});
			notify({ title: 'Tasdiqlandi' });
			setOpen(false);
			onConfirmed();
		} catch (err) {
			notify({ title: 'Xatolik', text: getApiErrorMessage(err, 'Tasdiqlashda xatolik yuz berdi') });
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Yuk chiqarilganini tasdiqlash</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p className='mb-3 text-xs text-ca-heading'>
						<span className='font-semibold'>{transfer.from_type_sklad_detail?.name}</span> dan{' '}
						<span className='font-semibold'>{transfer.to_type_sklad_detail?.name}</span>ga qilinayotgan #
						{transfer.id} transfer uchun yuk tayyorlanib chiqarilganini tasdiqlaysizmi?
					</p>
					<FormField label='Izoh' horizontal={false} className='mb-0'>
						<Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
					</FormField>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button
						type='button'
						variant='success'
						disabled={confirmMutation.isPending}
						onClick={handleConfirm}
					>
						<FaCheck className='mr-1.5' /> {confirmMutation.isPending ? 'Tasdiqlanmoqda...' : 'Tasdiqlash'}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

import { useNavigate } from 'react-router-dom';
import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { useReverseWarehouseTransferMutation } from '@/services/warehouse-transfer/warehouse-transfer.queries';
import type { WarehouseTransfer } from '@/services/warehouse-transfer/warehouse-transfer.types';

interface EditTransferModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	transfer: WarehouseTransfer;
}

export default function EditTransferModal({ open, setOpen, transfer }: EditTransferModalProps) {
	const navigate = useNavigate();
	const { notify } = useNotification();
	const reverseMutation = useReverseWarehouseTransferMutation();

	async function handleConfirm() {
		try {
			await reverseMutation.mutateAsync(transfer.id);
			setOpen(false);
			navigate('/warehouse-transfer', {
				state: {
					fromTypeSkladId: transfer.from_type_sklad,
					toTypeSkladId: transfer.to_type_sklad,
				},
			});
		} catch (err) {
			notify({ title: 'Xatolik', text: getApiErrorMessage(err, "Bekor qilishda xatolik yuz berdi") });
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Transferni tahrirlash</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p className='text-xs text-ca-heading'>
						Backendda transferni to'g'ridan-to'g'ri tahrirlash imkoni yo'q. Tahrirlash uchun avval{' '}
						<span className='font-semibold'>{transfer.from_type_sklad_detail?.name}</span> dan{' '}
						<span className='font-semibold'>{transfer.to_type_sklad_detail?.name}</span>ga qilingan #
						{transfer.id} transfer bekor qilinadi (tovarlar manba skladga qaytariladi), so'ngra siz shu
						ikki sklad turi oldindan tanlangan holda yangi transfer yaratish sahifasiga
						yo'naltirilasiz. Davom etasizmi?
					</p>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button type='button' variant='danger' disabled={reverseMutation.isPending} onClick={handleConfirm}>
						{reverseMutation.isPending ? 'Bekor qilinmoqda...' : 'Davom etish'}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

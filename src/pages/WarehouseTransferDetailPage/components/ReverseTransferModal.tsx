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
import type { WarehouseTransferDetail } from '@/services/warehouse-transfer/warehouse-transfer.types';

interface ReverseTransferModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	transfer: WarehouseTransferDetail;
	onReversed: () => void;
}

export default function ReverseTransferModal({ open, setOpen, transfer, onReversed }: ReverseTransferModalProps) {
	const { notify } = useNotification();
	const reverseMutation = useReverseWarehouseTransferMutation();

	async function handleReverse() {
		try {
			await reverseMutation.mutateAsync(transfer.id);
			notify({ title: 'Transfer bekor qilindi' });
			setOpen(false);
			onReversed();
		} catch (err) {
			notify({ title: 'Xatolik', text: getApiErrorMessage(err, "Bekor qilishda xatolik yuz berdi") });
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Transferni bekor qilishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p className='text-xs text-ca-heading'>
						<span className='font-semibold'>{transfer.from_type_sklad_detail?.name}</span> dan{' '}
						<span className='font-semibold'>{transfer.to_type_sklad_detail?.name}</span>ga qilingan #
						{transfer.id} transferni bekor qilmoqchimisiz? Qabul qiluvchi skladdan tovarlar ayiriladi va
						manba skladga qaytariladi.
					</p>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button type='button' variant='danger' disabled={reverseMutation.isPending} onClick={handleReverse}>
						{reverseMutation.isPending ? 'Bekor qilinmoqda...' : 'Tasdiqlash'}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

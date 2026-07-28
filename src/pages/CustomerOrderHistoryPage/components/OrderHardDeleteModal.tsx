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
import { useHardDeleteOrderAccountHistoryMutation } from '@/services/order-account-history/order-account-history.queries';

interface OrderHardDeleteModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	id: number;
	clientName?: string;
}

export default function OrderHardDeleteModal({ open, setOpen, id, clientName }: OrderHardDeleteModalProps) {
	const { notify } = useNotification();
	const hardDeleteMutation = useHardDeleteOrderAccountHistoryMutation();

	async function handleConfirm() {
		try {
			const result = await hardDeleteMutation.mutateAsync(id);
			notify({ title: result.message || "Buyurtma batamom o'chirildi" });
			setOpen(false);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, "O'chirishda xatolik yuz berdi") });
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Batamom o'chirishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>
						{clientName && <span className='font-semibold'>{clientName}</span>} mijozning buyurtmasini{' '}
						<span className='font-semibold text-ca-red'>butunlay</span> o'chirmoqchimisiz? Bu amalni ortga
						qaytarib bo'lmaydi.
					</p>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button type='button' variant='danger' onClick={handleConfirm} disabled={hardDeleteMutation.isPending}>
						Batamom o'chirish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

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
import { useDeletePaymentCardMutation } from '@/services/payment-card/payment-card.queries';
import { paymentCardTypeLabel, type PaymentCard } from '@/services/payment-card/payment-card.types';

interface DeletePaymentCardModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: PaymentCard;
}

export default function DeletePaymentCardModal({ open, setOpen, item }: DeletePaymentCardModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeletePaymentCardMutation();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "Karta o'chirildi" });
			setOpen(false);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, "O'chirishda xatolik yuz berdi") });
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>O'chirishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>
						"{item.name}" ({paymentCardTypeLabel(item)} •• {item.last4}) kartasini o'chirmoqchimisiz?
					</p>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button variant='danger' onClick={handleDelete} loading={deleteMutation.isPending}>
						O'chirish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

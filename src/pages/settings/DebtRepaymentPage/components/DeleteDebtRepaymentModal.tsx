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
import { useDeleteDebtRepaymentMutation } from '@/services/debt-repayment/debt-repayment.queries';
import type { DebtRepayment } from '@/services/debt-repayment/debt-repayment.types';

interface DeleteDebtRepaymentModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: DebtRepayment;
}

export default function DeleteDebtRepaymentModal({ open, setOpen, item }: DeleteDebtRepaymentModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteDebtRepaymentMutation();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "To'lov o'chirildi" });
			setOpen(false);
		} catch {
			notify({ title: "O'chirishda xatolik yuz berdi" });
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>O'chirishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>"{item.client_detail?.fio ?? item.client}" mijozining to'lovini o'chirmoqchimisiz?</p>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button variant='danger' onClick={handleDelete} disabled={deleteMutation.isPending}>
						O'chirish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

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
import { useDeleteExpenseTypeMutation } from '@/services/expense-type/expense-type.queries';
import type { ExpenseType } from '@/services/expense-type/expense-type.types';

interface DeleteExpenseTypeModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: ExpenseType;
}

export default function DeleteExpenseTypeModal({ open, setOpen, item }: DeleteExpenseTypeModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteExpenseTypeMutation();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "Xarajat turi o'chirildi" });
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
					<p>"{item.name}" nomli xarajat turini o'chirmoqchimisiz?</p>
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

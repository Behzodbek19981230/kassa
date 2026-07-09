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
import { useDeleteSkladTypeMutation } from '@/services/sklad-type/sklad-type.queries';
import type { SkladType } from '@/services/sklad-type/sklad-type.types';

interface DeleteSkladTypeModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: SkladType;
}

export default function DeleteSkladTypeModal({ open, setOpen, item }: DeleteSkladTypeModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteSkladTypeMutation();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "Sklad o'chirildi" });
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
					<p>"{item.name}" nomli skladni o'chirmoqchimisiz?</p>
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

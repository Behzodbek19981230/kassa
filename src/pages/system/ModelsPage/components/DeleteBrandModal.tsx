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
import { useDeleteBrandMutation } from '@/services/brand/brand.queries';
import type { Brand } from '@/services/brand/brand.types';

interface DeleteBrandModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: Brand;
}

export default function DeleteBrandModal({ open, setOpen, item }: DeleteBrandModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteBrandMutation();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "Model o'chirildi" });
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
					<p>"{item.name}" nomli modelni o'chirmoqchimisiz?</p>
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

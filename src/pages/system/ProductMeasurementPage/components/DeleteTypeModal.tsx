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
import { useDeleteBrandSizeTypeMutation } from '@/services/brand-size-type/brand-size-type.queries';
import type { BrandSizeType } from '@/services/brand-size-type/brand-size-type.types';

interface DeleteTypeModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: BrandSizeType;
}

export default function DeleteTypeModal({ open, setOpen, item }: DeleteTypeModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteBrandSizeTypeMutation();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "Tur o'chirildi" });
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
					<p>"{item.name}" nomli turni o'chirmoqchimisiz?</p>
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

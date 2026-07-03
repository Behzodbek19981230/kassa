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
import { useDeleteBrandSizeMutation } from '@/services/brand-size/brand-size.queries';
import type { BrandSize } from '@/services/brand-size/brand-size.types';

interface DeleteSizeModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: BrandSize;
}

export default function DeleteSizeModal({ open, setOpen, item }: DeleteSizeModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteBrandSizeMutation();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "O'lcham o'chirildi" });
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
					<p>"{item.size}" o'lchamli yozuvni o'chirmoqchimisiz?</p>
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

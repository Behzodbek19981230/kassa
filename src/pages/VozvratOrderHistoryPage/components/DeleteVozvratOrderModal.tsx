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
import { useDeleteVozvratOrderMutation } from '@/services/vozvrat/vozvrat.queries';
import type { VozvratOrderListItem } from '@/services/vozvrat/vozvrat.types';

interface DeleteVozvratOrderModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: VozvratOrderListItem;
}

export default function DeleteVozvratOrderModal({ open, setOpen, item }: DeleteVozvratOrderModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteVozvratOrderMutation();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "Vozvrat buyurtma o'chirildi" });
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
					<p>"{item.client_detail?.fio ?? item.client}" mijozining vozvrat buyurtmasini o'chirmoqchimisiz?</p>
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

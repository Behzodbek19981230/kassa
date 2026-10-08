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
import { useDeleteCountryMutation } from '@/services/country/country.queries';
import type { Country } from '@/services/country/country.types';

interface DeleteCountryModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: Country;
}

export default function DeleteCountryModal({ open, setOpen, item }: DeleteCountryModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteCountryMutation();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "Davlat o'chirildi" });
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
					<p>"{item.name}" nomli davlatni o'chirmoqchimisiz?</p>
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

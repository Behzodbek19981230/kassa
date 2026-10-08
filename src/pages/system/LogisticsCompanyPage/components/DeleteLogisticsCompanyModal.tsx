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
import { useDeleteLogisticsCompanyMutation } from '@/services/logistics-company/logistics-company.queries';
import type { LogisticsCompany } from '@/services/logistics-company/logistics-company.types';

interface DeleteLogisticsCompanyModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: LogisticsCompany;
}

export default function DeleteLogisticsCompanyModal({ open, setOpen, item }: DeleteLogisticsCompanyModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteLogisticsCompanyMutation();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "Logistika firmasi o'chirildi" });
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
					<p>"{item.name}" nomli logistika firmasini o'chirmoqchimisiz?</p>
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

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
import { useDeleteLogisticsWarehouseMutation } from '@/services/logistics-warehouse/logistics-warehouse.queries';
import type { LogisticsWarehouse } from '@/services/logistics-warehouse/logistics-warehouse.types';

interface DeleteLogisticsWarehouseModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: LogisticsWarehouse;
}

export default function DeleteLogisticsWarehouseModal({ open, setOpen, item }: DeleteLogisticsWarehouseModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteLogisticsWarehouseMutation();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "Logistika skladi o'chirildi" });
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
					<p>"{item.name}" nomli logistika skladini o'chirmoqchimisiz?</p>
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

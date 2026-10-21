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
import { formatNumber } from '@/lib/number';
import { useDeleteWarehouseMutation } from '@/services/warehouse/warehouse.queries';
import type { Warehouse } from '@/services/warehouse/warehouse.types';

interface DeleteWarehouseModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: Warehouse;
}

export default function DeleteWarehouseModal({ open, setOpen, item }: DeleteWarehouseModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteWarehouseMutation();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "Tovar o'chirildi" });
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
					<p>"{item.brand_detail?.name ?? item.brand}" tovarini o'chirmoqchimisiz?</p>
					{item.count > 0 && (
						<p className='mt-2 text-xs text-ca-red'>
							Diqqat: omborda {formatNumber(item.count)} dona qoldiq bor.
						</p>
					)}
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

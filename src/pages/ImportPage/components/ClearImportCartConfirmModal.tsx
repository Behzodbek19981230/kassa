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
import { useClearImportCartMutation } from '@/services/import-cart-draft/import-cart-draft.queries';

interface ClearImportCartConfirmModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	companyId: number;
	consignorId: number;
}

export default function ClearImportCartConfirmModal({
	open,
	setOpen,
	companyId,
	consignorId,
}: ClearImportCartConfirmModalProps) {
	const { notify } = useNotification();
	const clearCartMutation = useClearImportCartMutation();

	const handleClear = async () => {
		try {
			await clearCartMutation.mutateAsync({ company: companyId, consignor: consignorId });
			notify({ title: 'Import savati tozalandi' });
			setOpen(false);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, 'Tozalashda xatolik yuz berdi') });
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Bekor qilishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>Import savatidagi barcha mahsulotlarni o'chirmoqchimisiz?</p>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
						Yo'q
					</Button>
					<Button variant='danger' onClick={handleClear} disabled={clearCartMutation.isPending}>
						Ha, tozalash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

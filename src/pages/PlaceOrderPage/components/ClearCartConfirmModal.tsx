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
import { useClearOrderCartMutation } from '@/services/order-cart/order-cart.queries';

interface ClearCartConfirmModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	companyId: number;
	clientId: number;
}

export default function ClearCartConfirmModal({ open, setOpen, companyId, clientId }: ClearCartConfirmModalProps) {
	const { notify } = useNotification();
	const clearCartMutation = useClearOrderCartMutation();

	const handleClear = async () => {
		try {
			await clearCartMutation.mutateAsync({ company: companyId, client: clientId });
			notify({ title: 'Savatcha tozalandi' });
			setOpen(false);
		} catch {
			notify({ title: 'Tozalashda xatolik yuz berdi' });
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Bekor qilishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>Savatchadagi barcha mahsulotlarni o'chirmoqchimisiz?</p>
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

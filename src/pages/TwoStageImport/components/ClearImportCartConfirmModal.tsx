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
import { useClearCartMutation } from '@/services/two-stage-import/two-stage-import.queries';
import type { ImportStage } from '@/services/two-stage-import/two-stage-import.types';

interface ClearImportCartConfirmModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	stage: ImportStage;
}

export default function ClearImportCartConfirmModal({ open, setOpen, stage }: ClearImportCartConfirmModalProps) {
	const { notify } = useNotification();
	const clearCartMutation = useClearCartMutation();

	const handleClear = async () => {
		try {
			await clearCartMutation.mutateAsync(stage);
			notify({ title: 'Savatcha tozalandi' });
			setOpen(false);
		} catch (err) {
			notify({ title: 'Tozalashda xatolik', text: getApiErrorMessage(err, 'Tozalashda xatolik yuz berdi') });
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Bekor qilishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>Import savatchasidagi barcha mahsulotlarni o'chirmoqchimisiz?</p>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
						Yo'q
					</Button>
					<Button variant='danger' onClick={handleClear} loading={clearCartMutation.isPending}>
						Ha, tozalash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

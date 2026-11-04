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
import { useUpdateVozvratOrderStatusMutation } from '@/services/vozvrat/vozvrat.queries';

interface ConfirmVozvratUpdateModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	id: number;
}

export default function ConfirmVozvratUpdateModal({ open, setOpen, id }: ConfirmVozvratUpdateModalProps) {
	const { notify } = useNotification();
	const updateStatusMutation = useUpdateVozvratOrderStatusMutation();

	async function handleConfirm() {
		try {
			await updateStatusMutation.mutateAsync({ id, payload: { update_status: 1 } });
			setOpen(false);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, 'Xatolik yuz berdi') });
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>O'zgarishni tasdiqlash</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>Bu vozvratdagi o'zgarishni ko'rib chiqdingizmi va tasdiqlaysizmi?</p>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button type='button' variant='danger' onClick={handleConfirm} loading={updateStatusMutation.isPending}>
						Tasdiqlash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

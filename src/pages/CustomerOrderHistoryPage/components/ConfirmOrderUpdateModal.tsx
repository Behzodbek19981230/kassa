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
import { useUpdateOrderAccountHistoryStatusMutation } from '@/services/order-account-history/order-account-history.queries';

interface ConfirmOrderUpdateModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	id: number;
}

export default function ConfirmOrderUpdateModal({ open, setOpen, id }: ConfirmOrderUpdateModalProps) {
	const { notify } = useNotification();
	const updateStatusMutation = useUpdateOrderAccountHistoryStatusMutation();

	async function handleConfirm() {
		try {
			await updateStatusMutation.mutateAsync({ id, payload: { update_status: 2 } });
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
					<p>Bu buyurtmadagi o'zgarishni ko'rib chiqdingizmi va tasdiqlaysizmi?</p>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button
						type='button'
						variant='danger'
						onClick={handleConfirm}
						disabled={updateStatusMutation.isPending}
					>
						Tasdiqlash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

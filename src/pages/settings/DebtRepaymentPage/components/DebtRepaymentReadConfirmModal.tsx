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
import { useSetDebtRepaymentReadMutation } from '@/services/debt-repayment/debt-repayment.queries';

interface DebtRepaymentReadConfirmModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	id: number;
	isRead: boolean;
	clientName?: string;
}

export default function DebtRepaymentReadConfirmModal({
	open,
	setOpen,
	id,
	isRead,
	clientName,
}: DebtRepaymentReadConfirmModalProps) {
	const { notify } = useNotification();
	const setReadMutation = useSetDebtRepaymentReadMutation();

	async function handleConfirm() {
		try {
			await setReadMutation.mutateAsync({ id, isRead });
			setOpen(false);
		} catch (err) {
			notify({ title: 'Xatolik', text: getApiErrorMessage(err, "Holatni o'zgartirib bo'lmadi") });
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Tasdiqlash</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>
						{clientName && <span className='font-semibold'>{clientName}</span>} mijozning to'lovini
						tasdiqlamoqchimisiz?
					</p>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button type='button' variant='success' onClick={handleConfirm} loading={setReadMutation.isPending}>
						Tasdiqlash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

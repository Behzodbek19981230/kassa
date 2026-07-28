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
import { useHardDeleteDebtRepaymentMutation } from '@/services/debt-repayment/debt-repayment.queries';

interface DebtRepaymentHardDeleteModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	id: number;
	clientName?: string;
}

export default function DebtRepaymentHardDeleteModal({
	open,
	setOpen,
	id,
	clientName,
}: DebtRepaymentHardDeleteModalProps) {
	const { notify } = useNotification();
	const hardDeleteMutation = useHardDeleteDebtRepaymentMutation();

	async function handleConfirm() {
		try {
			const result = await hardDeleteMutation.mutateAsync(id);
			notify({ title: result.message || "To'lov batamom o'chirildi" });
			setOpen(false);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, "O'chirishda xatolik yuz berdi") });
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Batamom o'chirishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>
						{clientName && <span className='font-semibold'>{clientName}</span>} mijozning to'lovini{' '}
						<span className='font-semibold text-ca-red'>butunlay</span> o'chirmoqchimisiz? Bu amalni ortga
						qaytarib bo'lmaydi.
					</p>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button type='button' variant='danger' onClick={handleConfirm} disabled={hardDeleteMutation.isPending}>
						Batamom o'chirish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

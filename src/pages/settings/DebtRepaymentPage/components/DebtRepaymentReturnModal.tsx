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
import { useReturnDebtRepaymentMutation } from '@/services/debt-repayment/debt-repayment.queries';

interface DebtRepaymentReturnModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	id: number;
	clientName?: string;
}

export default function DebtRepaymentReturnModal({ open, setOpen, id, clientName }: DebtRepaymentReturnModalProps) {
	const { notify } = useNotification();
	const returnMutation = useReturnDebtRepaymentMutation();

	async function handleConfirm() {
		try {
			const result = await returnMutation.mutateAsync(id);
			notify({
				title: result.message || "To'lov qayta tiklandi",
				text: result.summary?.client_total_debt
					? `Mijoz qarzi: ${formatNumber(result.summary.client_total_debt, 2)} $`
					: undefined,
			});
			setOpen(false);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, 'Amalni bajarishda xatolik yuz berdi') });
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Qayta tiklashni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>
						{clientName && <span className='font-semibold'>{clientName}</span>} mijozning to'lovini qayta
						tiklamoqchimisiz? To'lov aktiv ro'yxatga qaytadi, mijoz qarzi qayta hisoblanadi.
					</p>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button type='button' variant='success' onClick={handleConfirm} disabled={returnMutation.isPending}>
						Qayta tiklash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

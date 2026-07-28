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
import { useDraftDeleteDebtRepaymentMutation } from '@/services/debt-repayment/debt-repayment.queries';

interface DebtRepaymentDraftDeleteModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	id: number;
	clientName?: string;
}

export default function DebtRepaymentDraftDeleteModal({
	open,
	setOpen,
	id,
	clientName,
}: DebtRepaymentDraftDeleteModalProps) {
	const { notify } = useNotification();
	const draftDeleteMutation = useDraftDeleteDebtRepaymentMutation();

	async function handleConfirm() {
		try {
			const result = await draftDeleteMutation.mutateAsync(id);
			notify({
				title: result.message || "To'lov draftga olindi",
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
					<ModalTitle>Draftga olishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>
						{clientName && <span className='font-semibold'>{clientName}</span>} mijozning to'lovini draftga
						olmoqchimisiz? To'lov aktiv ro'yxatdan chiqadi, mijoz qarzi qayta hisoblanadi.
					</p>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button type='button' variant='danger' onClick={handleConfirm} disabled={draftDeleteMutation.isPending}>
						Draftga olish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

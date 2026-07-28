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
import { useReturnOrderAccountHistoryMutation } from '@/services/order-account-history/order-account-history.queries';

interface OrderReturnModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	id: number;
	clientName?: string;
}

export default function OrderReturnModal({ open, setOpen, id, clientName }: OrderReturnModalProps) {
	const { notify } = useNotification();
	const returnMutation = useReturnOrderAccountHistoryMutation();

	async function handleConfirm() {
		try {
			const result = await returnMutation.mutateAsync(id);
			notify({
				title: result.message || 'Buyurtma qayta tiklandi',
				text: `Mijoz qarzi: ${formatNumber(result.summary.client_total_debt, 2)} $`,
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
						{clientName && <span className='font-semibold'>{clientName}</span>} mijozning buyurtmasini qayta
						tiklamoqchimisiz? Buyurtma aktiv ro'yxatga qaytadi, ombor va qarz balanslari qayta hisoblanadi.
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

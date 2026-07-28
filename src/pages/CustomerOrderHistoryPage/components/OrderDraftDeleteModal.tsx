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
import { useDraftDeleteOrderAccountHistoryMutation } from '@/services/order-account-history/order-account-history.queries';

interface OrderDraftDeleteModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	id: number;
	clientName?: string;
}

export default function OrderDraftDeleteModal({ open, setOpen, id, clientName }: OrderDraftDeleteModalProps) {
	const { notify } = useNotification();
	const draftDeleteMutation = useDraftDeleteOrderAccountHistoryMutation();

	async function handleConfirm() {
		try {
			const result = await draftDeleteMutation.mutateAsync(id);
			notify({
				title: result.message || 'Buyurtma draftga olindi',
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
					<ModalTitle>Draftga olishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>
						{clientName && <span className='font-semibold'>{clientName}</span>} mijozning buyurtmasini draftga
						olmoqchimisiz? Buyurtma aktiv ro'yxatdan chiqadi, ombor va qarz balanslari qayta hisoblanadi.
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

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
import { useDraftDeleteMyDebtHistoryMutation } from '@/services/my-debt/my-debt-history.queries';

interface MyDebtHistoryDraftDeleteModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	id: number;
	consignorName?: string;
}

export default function MyDebtHistoryDraftDeleteModal({
	open,
	setOpen,
	id,
	consignorName,
}: MyDebtHistoryDraftDeleteModalProps) {
	const { notify } = useNotification();
	const draftDeleteMutation = useDraftDeleteMyDebtHistoryMutation();

	async function handleConfirm() {
		try {
			const result = await draftDeleteMutation.mutateAsync(id);
			notify({
				title: result.message || 'Yozuv draftga olindi',
				text: result.summary?.consignor_total_debt
					? `Qarz: ${formatNumber(result.summary.consignor_total_debt, 2)} $`
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
						{consignorName && <span className='font-semibold'>{consignorName}</span>} qarz tarixidagi bu yozuvni
						draftga olmoqchimisiz? Yozuv aktiv ro'yxatdan chiqadi, qarz qayta hisoblanadi.
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

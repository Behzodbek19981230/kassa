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
import { useHardDeleteMyDebtHistoryMutation } from '@/services/my-debt/my-debt-history.queries';

interface MyDebtHistoryHardDeleteModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	id: number;
	consignorName?: string;
}

export default function MyDebtHistoryHardDeleteModal({
	open,
	setOpen,
	id,
	consignorName,
}: MyDebtHistoryHardDeleteModalProps) {
	const { notify } = useNotification();
	const hardDeleteMutation = useHardDeleteMyDebtHistoryMutation();

	async function handleConfirm() {
		try {
			const result = await hardDeleteMutation.mutateAsync(id);
			notify({ title: result.message || "Yozuv batamom o'chirildi" });
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
						{consignorName && <span className='font-semibold'>{consignorName}</span>} qarz tarixidagi bu yozuvni{' '}
						<span className='font-semibold text-ca-red'>butunlay</span> o'chirmoqchimisiz? Bu amalni ortga qaytarib
						bo'lmaydi.
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

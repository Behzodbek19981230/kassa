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
import { useDeleteMyDebtMutation } from '@/services/my-debt/my-debt.queries';

interface MyDebtDeleteModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	id: number;
	consignorName?: string;
	debt?: number;
}

export default function MyDebtDeleteModal({ open, setOpen, id, consignorName, debt }: MyDebtDeleteModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteMyDebtMutation();

	async function handleConfirm() {
		try {
			await deleteMutation.mutateAsync(id);
			notify({ title: "Qarz o'chirildi" });
			setOpen(false);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, "O'chirishda xatolik yuz berdi") });
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>O'chirishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>
						{consignorName && <span className='font-semibold'>{consignorName}</span>} bo'yicha qarzni
						{debt !== undefined && <span className='font-semibold text-ca-red'> ({formatNumber(debt, 2)} $)</span>}{' '}
						o'chirmoqchimisiz?
					</p>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button type='button' variant='danger' onClick={handleConfirm} loading={deleteMutation.isPending}>
						O'chirish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

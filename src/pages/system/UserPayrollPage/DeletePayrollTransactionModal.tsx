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
import { fmtDateTime, fmtDollar, TYPE_META } from '@/pages/system/UserPayrollPage/utils';
import { useDeletePayrollTransactionMutation } from '@/services/payroll/payroll.queries';
import type { PayrollTransaction } from '@/services/payroll/payroll.types';

interface DeletePayrollTransactionModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: PayrollTransaction;
}

export default function DeletePayrollTransactionModal({ open, setOpen, item }: DeletePayrollTransactionModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeletePayrollTransactionMutation();
	const typeLabel = TYPE_META[item.transaction_type]?.label ?? item.transaction_type;

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: `${typeLabel} o'chirildi` });
			setOpen(false);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, "O'chirishda xatolik yuz berdi") });
		}
	};

	return (
		<Modal open={open} onOpenChange={(next) => !deleteMutation.isPending && setOpen(next)}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>O'chirishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody className='space-y-1'>
					<p>
						{fmtDateTime(item.transaction_time)} dagi <b>{typeLabel}</b> amalini
						{Number(item.all_summa_dollar) ? ` (${fmtDollar(item.all_summa_dollar)})` : ''} o'chirmoqchimisiz?
					</p>
					<p>Oylik hisobi qayta hisoblanadi.</p>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)} disabled={deleteMutation.isPending}>
						Bekor qilish
					</Button>
					<Button variant='danger' onClick={handleDelete} loading={deleteMutation.isPending}>
						O'chirish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

import { useState } from 'react';
import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	Textarea,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { useCancelOrderMutation } from '@/services/two-stage-import/two-stage-import.queries';
import type { ImportOrderListItem } from '@/services/two-stage-import/two-stage-import.types';

interface CancelOrderModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	order: ImportOrderListItem;
}

export default function CancelOrderModal({ open, setOpen, order }: CancelOrderModalProps) {
	const { notify } = useNotification();
	const [note, setNote] = useState('');
	const [formError, setFormError] = useState('');
	const cancelMutation = useCancelOrderMutation();

	const handleCancel = async () => {
		setFormError('');
		try {
			await cancelMutation.mutateAsync({
				orderId: order.id,
				payload: { note: note.trim() || undefined },
			});
			notify({ title: 'Buyurtma bekor qilindi', text: order.order_number });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Bekor qilishda xatolik yuz berdi'));
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-lg'>
				<ModalHeader>
					<ModalTitle>Buyurtmani bekor qilishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{formError && (
						<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}
					<p className='mb-3'>
						<span className='font-semibold text-ca-red'>{order.order_number}</span> raqamli buyurtmani bekor
						qilmoqchimisiz?
					</p>
					<Textarea
						rows={2}
						placeholder='Izoh (ixtiyoriy)'
						value={note}
						onChange={(e) => setNote(e.target.value)}
					/>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
						Yo'q
					</Button>
					<Button variant='danger' onClick={handleCancel} loading={cancelMutation.isPending}>
						Ha, bekor qilish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

import { useState } from 'react';
import { FaUndoAlt } from 'react-icons/fa';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle, Textarea, useNotification } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { InfoStrip } from '@/pages/kassa/shared';
import { closingTypeLabel } from '@/pages/kassa/kassaType';
import { useCancelCashClosingMutation } from '@/services/cash-register/cash-register.queries';
import type { CashClosing } from '@/services/cash-register/cash-register.types';

/**
 * Super Admin only: cancels the latest closing of one seller type; that type's open kassa is then recomputed
 * from its closing before. The other types' kassas are not touched.
 */
export default function CancelClosingModal({
	closing,
	open,
	onOpenChange,
}: {
	closing: Pick<CashClosing, 'id' | 'number' | 'user_type'>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { notify } = useNotification();
	const [reason, setReason] = useState('');
	const [error, setError] = useState<string | null>(null);
	const mutation = useCancelCashClosingMutation();

	async function submit() {
		if (!reason.trim()) {
			setError('Bekor qilish sababini yozing.');
			return;
		}
		setError(null);
		try {
			await mutation.mutateAsync({ id: closing.id, reason: reason.trim() });
			notify({
				title: 'Bekor qilindi',
				text: `Topshirish ${closingTypeLabel(closing.user_type, true)} #${closing.number} bekor qilindi`,
			});
			setReason('');
			onOpenChange(false);
		} catch (err) {
			setError(getApiErrorMessage(err, "Bekor qilib bo'lmadi"));
		}
	}

	return (
		<Modal open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
			<ModalContent className='max-w-120'>
				<ModalHeader>
					<ModalTitle>
						Topshirish {closingTypeLabel(closing.user_type, true)} #{closing.number} ni bekor qilish
					</ModalTitle>
				</ModalHeader>
				<ModalBody className='space-y-3'>
					<InfoStrip tone='orange'>
						Bekor qilingandan keyin {closingTypeLabel(closing.user_type).toLowerCase()} kassasi shu turdagi oldingi
						topshirishdan qayta hisoblanadi, boshqa kassalarga ta'sir qilmaydi. Bu amalni qaytarib bo'lmaydi.
					</InfoStrip>
					<label className='block'>
						<span className='mb-1 block text-sm text-ca-heading'>Sabab (majburiy)</span>
						<Textarea
							rows={3}
							maxLength={2000}
							value={reason}
							autoFocus
							onChange={(e) => {
								setReason(e.target.value);
								if (error) setError(null);
							}}
							placeholder='Masalan: xato sanaldi'
							className={cn('lg:text-sm', error && 'border-red-500')}
						/>
						{error && <span className='mt-1 block text-xs text-red-500'>{error}</span>}
					</label>
				</ModalBody>
				<ModalFooter>
					<div className='flex gap-2'>
						<Button type='button' variant='white' size='sm' disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
							Ortga
						</Button>
						<Button type='button' variant='danger' size='sm' loading={mutation.isPending} onClick={submit}>
							{!mutation.isPending && <FaUndoAlt className='mr-1.5' />} Bekor qilish
						</Button>
					</div>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

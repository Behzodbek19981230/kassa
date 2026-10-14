import { useEffect, useState } from 'react';
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import {
	Button,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalTitle,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { useDeleteSkladMutation } from '@/services/sklad/sklad.queries';

const CONFIRM_WORD = 'Sklad';

interface DeleteSkladModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	skladId: number | null;
}

export default function DeleteSkladModal({ open, setOpen, skladId }: DeleteSkladModalProps) {
	const { notify } = useNotification();
	const [confirmText, setConfirmText] = useState('');
	const [formError, setFormError] = useState('');
	const deleteMutation = useDeleteSkladMutation();

	useEffect(() => {
		if (open) {
			setConfirmText('');
			setFormError('');
		}
	}, [open]);

	const isConfirmed = confirmText.trim().toLowerCase() === CONFIRM_WORD.toLowerCase();

	const handleDelete = async () => {
		if (!isConfirmed || skladId === null) return;
		setFormError('');
		try {
			await deleteMutation.mutateAsync(skladId);
			notify({ title: "Sklad o'chirildi" });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, "O'chirishda xatolik yuz berdi"));
		}
	};

	return (
		<Modal open={open} onOpenChange={(value) => !deleteMutation.isPending && setOpen(value)}>
			<ModalContent className='max-w-lg'>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleDelete();
					}}
				>
					<ModalBody className='pt-6'>
						<div className='mb-4 flex flex-col items-center text-center'>
							<div className='mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-ca-red bg-ca-danger-bg'>
								<FaTrash className='text-2xl text-ca-red' />
							</div>
							<ModalTitle className='text-lg font-bold'>Skladni o'chirish</ModalTitle>
							<p className='mt-1 text-sm'>Ushbu amalni bajarishni tasdiqlaysizmi?</p>
						</div>

						<div className='mb-4 flex gap-3 rounded border border-ca-orange/60 bg-ca-orange/10 px-3 py-3 text-xs text-ca-heading'>
							<FaExclamationTriangle className='mt-0.5 shrink-0 text-xl text-ca-orange' />
							<div className='space-y-2'>
								<p>
									Qozog'iston → O'zbekiston buyurtmasi, unga bog'langan mahsulotlar, qoldiqlar, tarixlar va
									logistika to'lovlari o'chiriladi. Mahsulotlar Qozog'iston tranzit skladiga qaytariladi.
								</p>
								<p>
									Xitoy → Qozog'iston ma'lumotlari saqlanib qoladi. Bu amalni ortga qaytarib bo'lmaydi.
								</p>
							</div>
						</div>

						{formError && (
							<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}

						<label htmlFor='delete-sklad-confirm' className='mb-1 block text-xs font-semibold text-ca-heading'>
							Tasdiqlash uchun <span className='font-bold'>{CONFIRM_WORD}</span> deb yozing
						</label>
						<Input
							id='delete-sklad-confirm'
							autoFocus
							autoComplete='off'
							placeholder={CONFIRM_WORD}
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							className={confirmText && !isConfirmed ? 'border-ca-red focus:border-ca-red' : undefined}
						/>
					</ModalBody>
					<ModalFooter>
						<Button
							type='button'
							variant='white'
							onClick={() => setOpen(false)}
							disabled={deleteMutation.isPending}
						>
							Bekor qilish
						</Button>
						<Button type='submit' variant='danger' disabled={!isConfirmed} loading={deleteMutation.isPending}>
							Skladni o'chirish
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}

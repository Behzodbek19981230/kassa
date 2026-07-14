import { useEffect, useState } from 'react';
import {
	Button,
	FormField,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { useUpdateProductCountMutation } from '@/services/product-account-history/product-account-history.queries';
import type { OrderAccountHistoryProductItem } from '@/services/order-account-history/order-account-history.types';

interface EditGivenCountModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: OrderAccountHistoryProductItem | null;
	orderId?: number;
}

export default function EditGivenCountModal({ open, setOpen, item, orderId }: EditGivenCountModalProps) {
	const { notify } = useNotification();
	const [value, setValue] = useState('');
	const [formError, setFormError] = useState('');
	const updateMutation = useUpdateProductCountMutation();

	useEffect(() => {
		if (open && item) {
			setValue(String(item.given_count));
			setFormError('');
		}
	}, [open, item]);

	function handleOpenChange(next: boolean) {
		setOpen(next);
	}

	async function handleSubmit() {
		if (!item) return;
		setFormError('');
		try {
			await updateMutation.mutateAsync({
				id: item.id,
				payload: { given_count: Number(value) },
				orderId,
			});
			notify({ title: "Berilgan tavar soni o'zgartirildi" });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, "O'zgartirishda xatolik yuz berdi"));
		}
	}

	return (
		<Modal open={open} onOpenChange={handleOpenChange}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Mijozga berilgan mahsulot sonini o'zgartirish</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{formError && (
						<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}
					<FormField label='Mijozga berilgan mahsulot soni' horizontal={false}>
						<Input
							type='number'
							value={value}
							onChange={(e) => setValue(e.target.value)}
						/>
					</FormField>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='default' onClick={() => setOpen(false)}>
						Yopish
					</Button>
					<Button type='button' variant='theme' onClick={handleSubmit} disabled={updateMutation.isPending}>
						O'zgartirish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

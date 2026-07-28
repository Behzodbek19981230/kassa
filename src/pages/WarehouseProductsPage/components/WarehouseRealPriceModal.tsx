import { useState } from 'react';
import {
	Button,
	FormField,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	PriceInput,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { useEditWarehouseRealPriceMutation } from '@/services/warehouse/warehouse.queries';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';

interface WarehouseRealPriceModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: WarehouseAllListItem;
}

export default function WarehouseRealPriceModal({ open, setOpen, item }: WarehouseRealPriceModalProps) {
	const { notify } = useNotification();
	const [realPrice, setRealPrice] = useState(String(item.real_price ?? ''));
	const [formError, setFormError] = useState('');

	const editMutation = useEditWarehouseRealPriceMutation();

	async function handleSubmit() {
		setFormError('');
		try {
			await editMutation.mutateAsync({ id: item.id, payload: { real_price: Number(realPrice) || 0 } });
			notify({ title: 'Asl narx yangilandi' });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>
						<span className='font-bold text-ca-red'>{item.brand_name}</span>{' '}
						<span className='text-ca-text'>{item.product_category_name}</span>
					</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{formError && (
						<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}
					<FormField label='Asl narxi ($)' horizontal={false}>
						<PriceInput value={realPrice} onChange={setRealPrice} autoFocus />
					</FormField>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button type='button' variant='primary' onClick={handleSubmit} disabled={editMutation.isPending}>
						Saqlash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

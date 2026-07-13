import { useState } from 'react';
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
import type { OrderAccountHistoryProductItem } from '@/services/order-account-history/order-account-history.types';

interface EditGivenCountModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: OrderAccountHistoryProductItem | null;
}

export default function EditGivenCountModal({ open, setOpen, item }: EditGivenCountModalProps) {
	const { notify } = useNotification();
	const [value, setValue] = useState('');

	function handleOpenChange(next: boolean) {
		if (next && item) setValue(String(item.given_count));
		setOpen(next);
	}

	function handleSubmit() {
		notify({ title: 'Tez orada', text: 'Bu funksiya hali ulanmagan.' });
		setOpen(false);
	}

	return (
		<Modal open={open} onOpenChange={handleOpenChange}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Mijozga berilgan mahsulot sonini o'zgartirish</ModalTitle>
				</ModalHeader>
				<ModalBody>
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
					<Button type='button' variant='theme' onClick={handleSubmit}>
						O'zgartirish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

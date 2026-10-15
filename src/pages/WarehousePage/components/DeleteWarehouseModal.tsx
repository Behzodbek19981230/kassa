import { useState } from 'react';
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
import { useDeleteSkladProductMutation } from '@/services/sklad-product/sklad-product.queries';
import type { SkladProduct } from '@/services/sklad-product/sklad-product.types';

interface DeleteWarehouseModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: SkladProduct;
	productLabel: string;
}

// Removes the product from one sklad only; the backend refuses while stock remains.
export default function DeleteWarehouseModal({ open, setOpen, item, productLabel }: DeleteWarehouseModalProps) {
	const { notify } = useNotification();
	const deleteMutation = useDeleteSkladProductMutation();
	const [error, setError] = useState('');

	const handleDelete = async () => {
		setError('');
		try {
			await deleteMutation.mutateAsync(item.id);
			notify({ title: "Tovar o'chirildi" });
			setOpen(false);
		} catch (err) {
			setError(getApiErrorMessage(err, "O'chirishda xatolik yuz berdi"));
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>O'chirishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{error && (
						<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
							{error}
						</div>
					)}
					<p>"{productLabel}" qoldig'ini sklad ro'yxatidan o'chirmoqchimisiz?</p>
					<p className='mt-1 text-xs text-ca-text'>Faqat qoldiq 0 bo'lganda o'chirish mumkin.</p>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
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

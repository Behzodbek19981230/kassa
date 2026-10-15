import { useState } from 'react';
import {
	Button,
	Checkbox,
	FormField,
	Input,
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
import { useUpdateSkladProductMutation } from '@/services/sklad-product/sklad-product.queries';
import type { SkladProduct } from '@/services/sklad-product/sklad-product.types';

interface WarehouseEditModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	/** One product's stock row in one sklad; its product and sklad are fixed. */
	item: SkladProduct;
	productLabel: string;
	skladName: string;
}

export default function WarehouseEditModal({ open, setOpen, item, productLabel, skladName }: WarehouseEditModalProps) {
	const { notify } = useNotification();

	const [count, setCount] = useState(String(item.count));
	const [realPrice, setRealPrice] = useState(item.real_price ?? '');
	const [workerPrice, setWorkerPrice] = useState(item.worker_price ?? '');
	const [statusCount, setStatusCount] = useState(Boolean(item.status_count));
	const [countError, setCountError] = useState('');
	const [formError, setFormError] = useState('');

	const updateMutation = useUpdateSkladProductMutation();

	const handleSubmit = async () => {
		setFormError('');
		setCountError('');

		const countNumber = Number(count || 0);
		if (!Number.isInteger(countNumber) || countNumber < 0) {
			setCountError("Soni 0 yoki musbat butun son bo'lishi kerak");
			return;
		}

		try {
			await updateMutation.mutateAsync({
				id: item.id,
				payload: {
					count: countNumber,
					real_price: realPrice || null,
					worker_price: workerPrice || null,
					status_count: statusCount,
				},
			});
			notify({ title: 'Tovar yangilandi' });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-2xl'>
				<ModalHeader>
					<ModalTitle>
						<span className='font-bold text-ca-red'>{productLabel}</span>{' '}
						<span className='text-ca-text'>({skladName}) ni o'zgartirmoqchimisiz ?</span>
					</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{formError && (
						<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}
					<div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
						<FormField label='Soni' error={countError} horizontal={false}>
							<Input
								type='number'
								inputMode='numeric'
								min={0}
								step={1}
								value={count}
								onChange={(e) => setCount(e.target.value)}
							/>
						</FormField>
						<FormField label='Asl narxi ($)' horizontal={false}>
							<PriceInput value={realPrice} onChange={setRealPrice} />
						</FormField>
						<FormField label='Ishchi Uchun Narx ($)' horizontal={false}>
							<PriceInput value={workerPrice} onChange={setWorkerPrice} />
						</FormField>
					</div>

					<Checkbox
						inline
						label='Mahsulot sanalganligini tasdiqlaysimi?'
						className='font-semibold text-ca-red'
						checked={statusCount}
						onCheckedChange={(v) => setStatusCount(!!v)}
					/>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Yopish
					</Button>
					<Button type='button' variant='primary' onClick={handleSubmit} loading={updateMutation.isPending}>
						Saqlash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

import { useEffect, useMemo, useState } from 'react';
import { FaUndo } from 'react-icons/fa';
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import type { VozvratProductItem } from '@/services/vozvrat/vozvrat.types';
import { rowKey, type VozvratVariant } from '@/pages/VozvratPage/utils';

interface AddToVozvratCartModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	variant: VozvratVariant;
	availableByKey: Record<string, number>;
	onAdd: (row: VozvratProductItem, count: number, price: number) => void;
}

export default function AddToVozvratCartModal({
	open,
	setOpen,
	variant,
	availableByKey,
	onAdd,
}: AddToVozvratCartModalProps) {
	const { data: skladTypesData } = useSkladTypeListQuery({ limit: 100 });

	const locationOptions = useMemo(() => {
		const skladTypes = skladTypesData?.results ?? [];
		return skladTypes.map((type) => ({
			value: String(type.id),
			label: type.name,
			row: variant.rows.find((r) => r.type_sklad === type.id),
		}));
	}, [skladTypesData, variant.rows]);

	const [locationKey, setLocationKey] = useState('');
	const [count, setCount] = useState('');
	const [price, setPrice] = useState('');
	const [error, setError] = useState('');

	// locationOptions only resolve once the sklad-type list loads; pick a sensible
	// default (preferring a location the client actually has stock at) once it does.
	useEffect(() => {
		if (locationOptions.length === 0 || locationOptions.some((o) => o.value === locationKey)) return;
		const preferred = locationOptions.find((o) => o.row) ?? locationOptions[0];
		setLocationKey(preferred.value);
		setPrice(preferred.row ? String(preferred.row.price_dollar) : '');
	}, [locationOptions, locationKey]);

	const selectedRow = locationOptions.find((o) => o.value === locationKey)?.row;
	const availableCount = selectedRow ? (availableByKey[rowKey(selectedRow)] ?? 0) : 0;

	function handleOpenChange(next: boolean) {
		if (!next) setOpen(next);
	}

	function handleLocationChange(value: string) {
		setLocationKey(value);
		const row = locationOptions.find((o) => o.value === value)?.row;
		setPrice(row ? String(row.price_dollar) : '');
	}

	function handleSubmit() {
		if (!selectedRow) {
			setError('Bu joyda qaytariladigan mahsulot mavjud emas');
			return;
		}
		const countValue = Number(count);
		const priceValue = Number(price);
		if (!countValue || countValue <= 0) {
			setError('Sonini kiriting');
			return;
		}
		if (countValue > availableCount) {
			setError(`Qaytariladigan son mijoz olgan qolgan sondan (${formatNumber(availableCount)} ta) oshib ketdi`);
			return;
		}
		if (!priceValue || priceValue <= 0) {
			setError('Narxni kiriting');
			return;
		}
		onAdd(selectedRow, countValue, priceValue);
		setOpen(false);
	}

	return (
		<Modal open={open} onOpenChange={handleOpenChange}>
			<ModalContent className='max-w-[420px]'>
				<ModalHeader>
					<ModalTitle>Vozvrat karzinkasiga qo'shish</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<div className='mb-4 flex flex-col gap-2 rounded-[3px] bg-ca-silver p-3 text-xs'>
						<div className='flex items-center justify-between'>
							<span className='font-semibold text-ca-heading'>Model:</span>
							<span className='truncate font-bold text-ca-red'>{variant.brandName}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='font-semibold text-ca-heading'>Nomi:</span>
							<span className='truncate font-bold text-ca-red'>{variant.categoryName}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='font-semibold text-ca-heading'>O'lchami:</span>
							<span className='font-bold text-ca-red'>{formatNumber(variant.size)}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='font-semibold text-ca-heading'>Tip:</span>
							<span className='font-bold text-ca-red'>{variant.typeName}</span>
						</div>
					</div>

					<FormField label='Joy' horizontal={false} className='mb-3'>
						<Select value={locationKey} onValueChange={handleLocationChange}>
							<SelectTrigger>
								<SelectValue placeholder='Tanlang...' />
							</SelectTrigger>
							<SelectContent>
								{locationOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormField>

					<FormField label='Soni' error={error} required horizontal={false} className='mb-3'>
						<Input
							type='number'
							inputMode='numeric'
							min={0}
							max={availableCount}
							step='1'
							value={count}
							onChange={(e) => setCount(e.target.value)}
						/>
						<p className='mt-1 text-[11px] text-ca-text'>
							Mijozda mavjud:{' '}
							<span className='font-semibold text-ca-heading'>{formatNumber(availableCount)} ta</span>
						</p>
					</FormField>

					<FormField label='Narxi ($)' horizontal={false}>
						<Input
							type='number'
							inputMode='decimal'
							min={0}
							step='0.01'
							value={price}
							onChange={(e) => setPrice(e.target.value)}
						/>
					</FormField>
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button type='button' variant='danger' onClick={handleSubmit}>
						<FaUndo className='mr-1.5' /> Karzinkaga qo'shish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

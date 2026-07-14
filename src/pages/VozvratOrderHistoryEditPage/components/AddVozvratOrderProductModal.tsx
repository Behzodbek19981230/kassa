import { useEffect, useMemo, useState } from 'react';
import { FaUndo } from 'react-icons/fa';
import {
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
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
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { brandService } from '@/services/brand/brand.service';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useVozvratProductsQuery } from '@/services/vozvrat/vozvrat.queries';
import { useCreateVozvratOrderProductMutation } from '@/services/vozvrat-order-product/vozvrat-order-product.queries';
import { groupIntoVariants, rowKey, type VozvratVariant } from '@/pages/VozvratPage/utils';

interface AddVozvratOrderProductModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	vozvratOrderId: number;
	clientId: number;
}

export default function AddVozvratOrderProductModal({
	open,
	setOpen,
	vozvratOrderId,
	clientId,
}: AddVozvratOrderProductModalProps) {
	const { notify } = useNotification();
	const [brand, setBrand] = useState('');
	const [productCategory, setProductCategory] = useState('');
	const [variantKey, setVariantKey] = useState('');
	const [locationKey, setLocationKey] = useState('');
	const [count, setCount] = useState('');
	const [price, setPrice] = useState('');
	const [error, setError] = useState('');

	const { data: productsData } = useVozvratProductsQuery(
		brand && productCategory
			? { client_id: clientId, brand_id: Number(brand), product_category_id: Number(productCategory) }
			: undefined,
	);

	const variants: VozvratVariant[] = useMemo(
		() => groupIntoVariants((productsData?.groups ?? []).flatMap((g) => g.items)),
		[productsData],
	);
	const selectedVariant = variants.find((v) => v.key === variantKey);

	const locationOptions = useMemo(() => {
		if (!selectedVariant) return [];
		return selectedVariant.rows.map((row) => ({
			value: String(row.type_sklad),
			label: row.type_sklad_name,
			row,
		}));
	}, [selectedVariant]);

	useEffect(() => {
		if (locationOptions.length === 0) {
			setLocationKey('');
			return;
		}
		if (!locationOptions.some((o) => o.value === locationKey)) {
			setLocationKey(locationOptions[0].value);
			setPrice(String(locationOptions[0].row.price_dollar));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [locationOptions]);

	const selectedRow = locationOptions.find((o) => o.value === locationKey)?.row;

	const loadBrandOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await brandService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((b) => ({ value: String(b.id), label: b.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadCategoryOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		if (!brand) return { options: [], hasMore: false };
		const result = await productCategoryService.list({
			brand: Number(brand),
			search: search || undefined,
			page,
			limit: 20,
		});
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	function handleBrandChange(value: string) {
		setBrand(value);
		setProductCategory('');
		setVariantKey('');
	}

	function handleCategoryChange(value: string) {
		setProductCategory(value);
		setVariantKey('');
	}

	function handleLocationChange(value: string) {
		setLocationKey(value);
		const row = locationOptions.find((o) => o.value === value)?.row;
		setPrice(row ? String(row.price_dollar) : '');
	}

	function handleOpenChange(next: boolean) {
		if (!next) {
			setBrand('');
			setProductCategory('');
			setVariantKey('');
			setLocationKey('');
			setCount('');
			setPrice('');
			setError('');
		}
		setOpen(next);
	}

	const createMutation = useCreateVozvratOrderProductMutation();

	async function handleSubmit() {
		setError('');
		if (!selectedRow) {
			setError('Qaytariladigan mahsulotni tanlang');
			return;
		}
		const countValue = Number(count);
		const priceValue = Number(price);
		if (!countValue || countValue <= 0) {
			setError('Sonini kiriting');
			return;
		}
		if (countValue > selectedRow.remaining_count) {
			setError(`Qaytariladigan son mijoz olgan qolgan sondan (${formatNumber(selectedRow.remaining_count)} ta) oshib ketdi`);
			return;
		}
		if (!priceValue || priceValue <= 0) {
			setError('Narxni kiriting');
			return;
		}

		try {
			await createMutation.mutateAsync({
				vozvrat_order: vozvratOrderId,
				warehouse: selectedRow.warehouse,
				count: countValue,
				price: priceValue,
			});
			notify({ title: "Mahsulot vozvrat buyurtmasiga qo'shildi" });
			handleOpenChange(false);
		} catch (err) {
			setError(getApiErrorMessage(err, "Qo'shishda xatolik yuz berdi"));
		}
	}

	return (
		<Modal open={open} onOpenChange={handleOpenChange}>
			<ModalContent className='max-w-[500px]'>
				<ModalHeader>
					<ModalTitle>Vozvrat buyurtmasiga mahsulot qo'shish</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{error && (
						<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
							{error}
						</div>
					)}

					<FormField label='Model' required horizontal={false} className='mb-3'>
						<Combobox
							value={brand}
							onChange={handleBrandChange}
							loadOptions={loadBrandOptions}
							placeholder='Tanlang...'
							searchPlaceholder='Model qidirish...'
						/>
					</FormField>

					<FormField label='Nomi' required horizontal={false} className='mb-3'>
						<Combobox
							value={productCategory}
							onChange={handleCategoryChange}
							loadOptions={loadCategoryOptions}
							placeholder='Tanlang...'
							searchPlaceholder='Nomi qidirish...'
							disabled={!brand}
						/>
					</FormField>

					<FormField label="O'lchami" required horizontal={false} className='mb-3'>
						<Combobox
							value={variantKey}
							onChange={setVariantKey}
							options={variants.map((v) => ({
								value: v.key,
								label: `${formatNumber(v.size)} ${v.typeName} — ${v.orderDateLabel}`,
							}))}
							placeholder='Tanlang...'
							searchPlaceholder='Qidirish...'
							disabled={!productCategory}
						/>
					</FormField>

					<FormField label='Joy' horizontal={false} className='mb-3'>
						<Select value={locationKey} onValueChange={handleLocationChange}>
							<SelectTrigger>
								<SelectValue placeholder='Tanlang...' />
							</SelectTrigger>
							<SelectContent>
								{locationOptions.map((option) => (
									<SelectItem key={rowKey(option.row)} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormField>

					<FormField label='Soni' required horizontal={false} className='mb-3'>
						<Input
							type='number'
							inputMode='numeric'
							min={0}
							max={selectedRow?.remaining_count}
							step='1'
							value={count}
							onChange={(e) => setCount(e.target.value)}
						/>
						{selectedRow && (
							<p className='mt-1 text-[11px] text-ca-text'>
								Mijozda mavjud:{' '}
								<span className='font-semibold text-ca-heading'>
									{formatNumber(selectedRow.remaining_count)} ta
								</span>
							</p>
						)}
					</FormField>

					<FormField label='Narxi ($)' required horizontal={false}>
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
					<Button type='button' variant='white' onClick={() => handleOpenChange(false)}>
						Bekor qilish
					</Button>
					<Button type='button' variant='danger' onClick={handleSubmit} disabled={createMutation.isPending}>
						<FaUndo className='mr-1.5' /> Qo'shish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

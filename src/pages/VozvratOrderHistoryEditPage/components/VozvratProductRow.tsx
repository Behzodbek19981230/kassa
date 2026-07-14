import { useEffect, useMemo } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { Button, Combobox, type ComboboxLoadParams, type ComboboxLoadResult, PriceInput } from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { generateId } from '@/lib/utils';
import { brandService } from '@/services/brand/brand.service';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useVozvratProductsQuery } from '@/services/vozvrat/vozvrat.queries';
import type { VozvratProductItem } from '@/services/vozvrat/vozvrat.types';
import { groupIntoVariants, type VozvratVariant } from '@/pages/VozvratPage/utils';

export interface VozvratRowValue {
	key: number | string;
	brand: string;
	product_category: string;
	variantKey: string;
	locationKey: string;
	count: number | null;
	price: string;
}

export const emptyVozvratRow = (): VozvratRowValue => ({
	key: generateId(),
	brand: '',
	product_category: '',
	variantKey: '',
	locationKey: '',
	count: null,
	price: '',
});

interface VozvratProductRowProps {
	value: VozvratRowValue;
	onChange: (value: VozvratRowValue) => void;
	error?: string;
	showAdd?: boolean;
	onAdd?: () => void;
	showRemove?: boolean;
	onRemove?: () => void;
	clientId: number;
	onResolve?: (key: string | number, row: VozvratProductItem | undefined) => void;
}

export default function VozvratProductRow({
	value,
	onChange,
	error,
	showAdd,
	onAdd,
	showRemove,
	onRemove,
	clientId,
	onResolve,
}: VozvratProductRowProps) {
	const brandId = value.brand ? Number(value.brand) : undefined;
	const categoryId = value.product_category ? Number(value.product_category) : undefined;

	const { data: productsData } = useVozvratProductsQuery(
		brandId && categoryId
			? { client_id: clientId, brand_id: brandId, product_category_id: categoryId }
			: undefined,
	);

	const variants: VozvratVariant[] = useMemo(
		() => groupIntoVariants((productsData?.groups ?? []).flatMap((g) => g.items)),
		[productsData],
	);
	const selectedVariant = variants.find((v) => v.key === value.variantKey);

	const locationOptions = useMemo(() => {
		if (!selectedVariant) return [];
		return selectedVariant.rows.map((row) => ({ value: String(row.type_sklad), label: row.type_sklad_name, row }));
	}, [selectedVariant]);

	const selectedRow = locationOptions.find((o) => o.value === value.locationKey)?.row;

	useEffect(() => {
		onResolve?.(value.key, selectedRow);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedRow, value.key]);

	const loadBrandOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await brandService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((b) => ({ value: String(b.id), label: b.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadCategoryOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		if (!brandId) return { options: [], hasMore: false };
		const result = await productCategoryService.list({
			brand: brandId,
			search: search || undefined,
			page,
			limit: 20,
		});
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	function handleBrandChange(brand: string) {
		onChange({ ...value, brand, product_category: '', variantKey: '', locationKey: '' });
	}

	function handleCategoryChange(product_category: string) {
		onChange({ ...value, product_category, variantKey: '', locationKey: '' });
	}

	function handleVariantChange(variantKey: string) {
		onChange({ ...value, variantKey, locationKey: '' });
	}

	function handleLocationChange(locationKey: string) {
		const row = locationOptions.find((o) => o.value === locationKey)?.row;
		onChange({ ...value, locationKey, price: row ? String(row.price_dollar) : value.price });
	}

	return (
		<div className='mb-3'>
			<div className='flex flex-wrap items-start gap-3'>
				<div className='min-w-45 flex-1'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>
						Model <span className='text-ca-red'>*</span>
					</label>
					<Combobox
						value={value.brand}
						onChange={handleBrandChange}
						loadOptions={loadBrandOptions}
						placeholder='Tanlang...'
						searchPlaceholder='Model qidirish...'
					/>
				</div>
				<div className='min-w-45 flex-1'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>
						Nomi <span className='text-ca-red'>*</span>
					</label>
					<Combobox
						value={value.product_category}
						onChange={handleCategoryChange}
						loadOptions={loadCategoryOptions}
						placeholder='Tanlang...'
						searchPlaceholder='Nomi qidirish...'
						disabled={!value.brand}
					/>
				</div>
				<div className='min-w-37.5 flex-1'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>
						O'lchami <span className='text-ca-red'>*</span>
					</label>
					<Combobox
						value={value.variantKey}
						onChange={handleVariantChange}
						options={variants.map((v) => ({ value: v.key, label: formatNumber(v.size) }))}
						placeholder='Tanlang...'
						searchPlaceholder='Qidirish...'
						disabled={!value.product_category}
					/>
				</div>
				<div className='min-w-37.5 flex-1'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>Tip</label>
					<Combobox
						value={value.variantKey}
						onChange={() => {}}
						options={[]}
						selectedLabel={selectedVariant?.typeName}
						placeholder='Tanlang...'
						disabled
					/>
				</div>
				<div className='min-w-37.5 flex-1'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>
						Joy <span className='text-ca-red'>*</span>
					</label>
					<Combobox
						value={value.locationKey}
						onChange={handleLocationChange}
						options={locationOptions.map((o) => ({ value: o.value, label: o.label }))}
						placeholder='Tanlang...'
						searchPlaceholder='Qidirish...'
						disabled={!value.variantKey}
					/>
				</div>
				<div className='min-w-25 flex-1'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>
						Soni <span className='text-ca-red'>*</span>
					</label>
					<PriceInput
						value={value.count ?? ''}
						onChange={(count) => onChange({ ...value, count: count ? Number(count) : null })}
					/>
				</div>
				<div className='min-w-37.5 flex-1'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>
						Narxi ($) <span className='text-ca-red'>*</span>
					</label>
					<PriceInput value={value.price} onChange={(price) => onChange({ ...value, price })} />
					{error && <p className='mt-1 text-[11px] text-ca-red'>{error}</p>}
				</div>
				<div className='flex w-16 shrink-0 self-end justify-end gap-1'>
					{showRemove && (
						<Button
							type='button'
							variant='danger'
							size='icon'
							aria-label="Qatorni o'chirish"
							onClick={onRemove}
						>
							<FaTrash />
						</Button>
					)}
					{showAdd && (
						<Button type='button' variant='success' size='icon' aria-label="Qator qo'shish" onClick={onAdd}>
							<FaPlus />
						</Button>
					)}
				</div>
			</div>
			{value.variantKey &&
				(selectedRow ? (
					<p className='mt-1 text-[11px] text-ca-text'>
						Qoldiq: <span className='font-semibold text-ca-heading'>{formatNumber(selectedRow.remaining_count)} ta</span>
					</p>
				) : value.locationKey ? (
					<p className='mt-1 text-[11px] font-semibold text-ca-red'>Bu tovar mijozda topilmadi</p>
				) : null)}
		</div>
	);
}

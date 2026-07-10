import { useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { Button, Combobox, type ComboboxLoadParams, type ComboboxLoadResult, PriceInput } from '@/components/ui';
import { useBrandListQuery } from '@/services/brand/brand.queries';
import { brandService } from '@/services/brand/brand.service';
import { useBrandSizeListQuery } from '@/services/brand-size/brand-size.queries';
import { useBrandSizeTypeListQuery } from '@/services/brand-size-type/brand-size-type.queries';
import { useProductCategoryListQuery } from '@/services/product-category/product-category.queries';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import { skladTypeService } from '@/services/sklad-type/sklad-type.service';
import { generateId } from '@/lib/utils';

export interface WarehouseRowValue {
	key: number | string;
	brand: string;
	product_category: string;
	brandSize: string;
	size: number | null;
	type: number | null;
	type_sklad: string;
	price: string;
}

export const emptyWarehouseRow = (): WarehouseRowValue => ({
	key: generateId(),
	brand: '',
	product_category: '',
	brandSize: '',
	size: null,
	type: null,
	type_sklad: '',
	price: '',
});

interface WarehouseProductRowProps {
	value: WarehouseRowValue;
	onChange: (value: WarehouseRowValue) => void;
	error?: string;
	showAdd?: boolean;
	onAdd?: () => void;
	showRemove?: boolean;
	onRemove?: () => void;
}

export default function WarehouseProductRow({
	value,
	onChange,
	error,
	showAdd,
	onAdd,
	showRemove,
	onRemove,
}: WarehouseProductRowProps) {
	const { data: brandData } = useBrandListQuery({ limit: 100 });
	const brandNameById = new Map((brandData?.results ?? []).map((b) => [b.id, b.name]));

	const brandId = value.brand ? Number(value.brand) : undefined;
	const { data: categoryData } = useProductCategoryListQuery({ brand: brandId, limit: 100 });
	const categoryNameById = new Map((categoryData?.results ?? []).map((c) => [c.id, c.name]));

	const categoryId = value.product_category ? Number(value.product_category) : undefined;
	const { data: brandSizeData } = useBrandSizeListQuery({
		brand: brandId,
		product_category: categoryId,
		limit: 100,
	});
	const brandSizes = brandSizeData?.results ?? [];
	const brandSizeOptions = brandSizes.map((bs) => ({ value: String(bs.id), label: bs.size }));
	const selectedBrandSize = brandSizes.find((bs) => bs.id === Number(value.brandSize));

	const { data: typeData } = useBrandSizeTypeListQuery({ limit: 100 });
	const typeNameById = new Map((typeData?.results ?? []).map((t) => [t.id, t.name]));

	const { data: skladTypeData } = useSkladTypeListQuery({ limit: 100 });
	const skladTypeNameById = new Map((skladTypeData?.results ?? []).map((s) => [s.id, s.name]));

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

	useEffect(() => {
		if (!value.brandSize && value.size !== null && value.type !== null && brandSizes.length > 0) {
			const match = brandSizes.find((bs) => Number(bs.size) === value.size && bs.type === value.type);
			if (match) onChange({ ...value, brandSize: String(match.id) });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [brandSizes, value.size, value.type, value.brandSize]);

	const handleBrandChange = (brand: string) => {
		onChange({ ...value, brand, product_category: '', brandSize: '', size: null, type: null });
	};

	const handleCategoryChange = (product_category: string) => {
		onChange({ ...value, product_category, brandSize: '', size: null, type: null });
	};

	const handleBrandSizeChange = (brandSize: string) => {
		const bs = brandSizes.find((item) => item.id === Number(brandSize));
		onChange({ ...value, brandSize, size: bs ? Number(bs.size) : null, type: bs ? bs.type : null });
	};

	const loadSkladTypeOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await skladTypeService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((s) => ({ value: String(s.id), label: s.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	return (
		<div className='mb-3 flex flex-wrap items-start gap-3'>
			<div className='min-w-37.5 flex-1'>
				<label className='mb-1 block text-xs font-semibold text-ca-heading'>Sklad</label>
				<Combobox
					value={value.type_sklad}
					onChange={(type_sklad) => onChange({ ...value, type_sklad })}
					loadOptions={loadSkladTypeOptions}
					selectedLabel={skladTypeNameById.get(Number(value.type_sklad))}
					placeholder='Tanlang...'
					searchPlaceholder='Qidirish...'
					clearable
				/>
			</div>
			<div className='min-w-45 flex-1'>
				<label className='mb-1 block text-xs font-semibold text-ca-heading'>Model</label>
				<Combobox
					value={value.brand}
					onChange={handleBrandChange}
					loadOptions={loadBrandOptions}
					selectedLabel={brandNameById.get(Number(value.brand))}
					placeholder='Tanlang...'
					searchPlaceholder='Model qidirish...'
				/>
			</div>
			<div className='min-w-45 flex-1'>
				<label className='mb-1 block text-xs font-semibold text-ca-heading'>Nomi</label>
				<Combobox
					value={value.product_category}
					onChange={handleCategoryChange}
					loadOptions={loadCategoryOptions}
					selectedLabel={categoryNameById.get(Number(value.product_category))}
					placeholder='Tanlang...'
					searchPlaceholder='Nomi qidirish...'
					disabled={!value.brand}
				/>
			</div>
			<div className='min-w-37.5 flex-1'>
				<label className='mb-1 block text-xs font-semibold text-ca-heading'>O'lchami</label>
				<Combobox
					value={value.brandSize}
					onChange={handleBrandSizeChange}
					options={brandSizeOptions}
					selectedLabel={selectedBrandSize?.size}
					placeholder='Tanlang...'
					searchPlaceholder='Qidirish...'
					disabled={!value.product_category}
				/>
			</div>
			<div className='min-w-37.5 flex-1'>
				<label className='mb-1 block text-xs font-semibold text-ca-heading'>Tip</label>
				<Combobox
					value={value.type ? String(value.type) : ''}
					onChange={() => {}}
					options={[]}
					selectedLabel={value.type ? typeNameById.get(value.type) : undefined}
					placeholder='Tanlang...'
					disabled
				/>
			</div>

			<div className='min-w-37.5 flex-1'>
				<label className='mb-1 block text-xs font-semibold text-ca-heading'>Narxi</label>
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
					<Button type='button' variant='success' size='icon' aria-label='Qator qo’shish' onClick={onAdd}>
						<FaPlus />
					</Button>
				)}
			</div>
		</div>
	);
}

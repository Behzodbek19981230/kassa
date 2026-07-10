import { useEffect, useState } from 'react';
import {
	Button,
	Checkbox,
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
	PriceInput,
	Textarea,
	useNotification,
} from '@/components/ui';
import { useBrandListQuery } from '@/services/brand/brand.queries';
import { brandService } from '@/services/brand/brand.service';
import { useBrandSizeListQuery } from '@/services/brand-size/brand-size.queries';
import { useBrandSizeTypeListQuery } from '@/services/brand-size-type/brand-size-type.queries';
import { useProductCategoryListQuery } from '@/services/product-category/product-category.queries';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useSkladTypeListQuery } from '@/services/sklad-type/sklad-type.queries';
import { skladTypeService } from '@/services/sklad-type/sklad-type.service';
import { useUpdateWarehouseMutation, useWarehouseQuery } from '@/services/warehouse/warehouse.queries';
import type { Warehouse, WarehousePayload } from '@/services/warehouse/warehouse.types';

interface WarehouseEditModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: Warehouse;
}

export default function WarehouseEditModal({ open, setOpen, item }: WarehouseEditModalProps) {
	const { notify } = useNotification();

	const [brand, setBrand] = useState(String(item.brand));
	const [productCategory, setProductCategory] = useState(String(item.product_category));
	const [brandSize, setBrandSize] = useState('');
	const [size, setSize] = useState<number | null>(item.size);
	const [type, setType] = useState<number | null>(item.type);
	const [typeSklad, setTypeSklad] = useState(item.type_sklad ? String(item.type_sklad) : '');
	const [count, setCount] = useState(String(item.count));
	const [workerPrice, setWorkerPrice] = useState(String(item.worker_price));
	const [comment, setComment] = useState(item.comment ?? '');
	const [statusCount, setStatusCount] = useState(item.status_count);
	const [commentError, setCommentError] = useState('');
	const [skladError, setSkladError] = useState('');
	const [formError, setFormError] = useState('');

	const { data: brandData } = useBrandListQuery({ limit: 100 });
	const brandNameById = new Map((brandData?.results ?? []).map((b) => [b.id, b.name]));

	const brandId = brand ? Number(brand) : undefined;
	const { data: categoryData } = useProductCategoryListQuery({ brand: brandId, limit: 100 });
	const categoryNameById = new Map((categoryData?.results ?? []).map((c) => [c.id, c.name]));

	const categoryId = productCategory ? Number(productCategory) : undefined;
	const { data: brandSizeData } = useBrandSizeListQuery({ brand: brandId, product_category: categoryId, limit: 100 });
	const brandSizes = brandSizeData?.results ?? [];
	const brandSizeOptions = brandSizes.map((bs) => ({ value: String(bs.id), label: bs.size }));
	const selectedBrandSize = brandSizes.find((bs) => bs.id === Number(brandSize));

	const { data: typeData } = useBrandSizeTypeListQuery({ limit: 100 });
	const typeNameById = new Map((typeData?.results ?? []).map((t) => [t.id, t.name]));

	const { data: skladTypeData } = useSkladTypeListQuery({ limit: 100 });
	const skladTypeNameById = new Map((skladTypeData?.results ?? []).map((s) => [s.id, s.name]));

	const updateMutation = useUpdateWarehouseMutation();
	const warehouseQuery = useWarehouseQuery(item.id);

	useEffect(() => {
		const w = warehouseQuery.data;
		if (!w) return;
		setBrand(String(w.brand));
		setProductCategory(String(w.product_category));
		setBrandSize('');
		setSize(Number(w.size));
		setType(w.type);
		setTypeSklad(w.type_sklad ? String(w.type_sklad) : '');
		setCount(String(w.count));
		setWorkerPrice(String(w.worker_price));
		setComment(w.comment ?? '');
		setStatusCount(w.status_count);
	}, [warehouseQuery.data]);

	useEffect(() => {
		if (!brandSize && size !== null && type !== null && brandSizes.length > 0) {
			const match = brandSizes.find((bs) => Number(bs.size) === size && bs.type === type);
			if (match) setBrandSize(String(match.id));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [brandSizes, size, type, brandSize]);

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

	const loadSkladTypeOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await skladTypeService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((s) => ({ value: String(s.id), label: s.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const handleBrandChange = (value: string) => {
		setBrand(value);
		setProductCategory('');
		setBrandSize('');
		setSize(null);
		setType(null);
	};

	const handleCategoryChange = (value: string) => {
		setProductCategory(value);
		setBrandSize('');
		setSize(null);
		setType(null);
	};

	const handleBrandSizeChange = (value: string) => {
		const bs = brandSizes.find((item) => item.id === Number(value));
		setBrandSize(value);
		setSize(bs ? Number(bs.size) : null);
		setType(bs ? bs.type : null);
	};

	const handleSubmit = async () => {
		setFormError('');
		setCommentError('');
		setSkladError('');

		if (!typeSklad) {
			setSkladError('Sklad tanlanishi shart');
			return;
		}

		if (!comment.trim()) {
			setCommentError('Izoh kiritilishi shart');
			return;
		}

		const w = warehouseQuery.data ?? item;
		const payload: WarehousePayload = {
			cr_date: w.cr_date,
			size: size ?? w.size,
			count: Number(count) || 0,
			price: w.price,
			worker_price: Number(workerPrice) || 0,
			status_count: statusCount,
			company: w.company,
			brand: Number(brand),
			product_category: Number(productCategory),
			type,
			type_sklad: typeSklad ? Number(typeSklad) : null,
			all_sum_dollar: w.all_sum_dollar,
			all_discount_amount: w.all_discount_amount,
			all_my_total_debt: w.all_my_total_debt,
			comment: comment.trim(),
		};

		try {
			await updateMutation.mutateAsync({ id: item.id, payload });
			notify({ title: 'Tovar yangilandi' });
			setOpen(false);
		} catch {
			setFormError('Saqlashda xatolik yuz berdi');
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-2xl'>
				<ModalHeader>
					<ModalTitle>
						<span className='font-bold text-ca-red'>{item.brand_detail?.name ?? item.brand}</span>{' '}
						<span className='text-ca-text'>nomli modelni o'zgartirmoqchimisiz ?</span>
					</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{formError && (
						<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}
					<FormField label='Sklad' error={skladError} required horizontal={false}>
						<Combobox
							value={typeSklad}
							onChange={(value) => {
								setTypeSklad(value);
								if (value) setSkladError('');
							}}
							loadOptions={loadSkladTypeOptions}
							selectedLabel={skladTypeNameById.get(Number(typeSklad))}
							placeholder='Tanlang...'
							searchPlaceholder='Qidirish...'
							clearable
						/>
					</FormField>
					<div className='grid grid-cols-1 gap-x-4 sm:grid-cols-2'>
						<FormField label='Model' horizontal={false}>
							<Combobox
								value={brand}
								onChange={handleBrandChange}
								loadOptions={loadBrandOptions}
								selectedLabel={brandNameById.get(Number(brand))}
								placeholder='Tanlang...'
								searchPlaceholder='Model qidirish...'
								disabled
							/>
						</FormField>
						<FormField label='Nomi' horizontal={false}>
							<Combobox
								value={productCategory}
								onChange={handleCategoryChange}
								loadOptions={loadCategoryOptions}
								selectedLabel={categoryNameById.get(Number(productCategory))}
								placeholder='Tanlang...'
								searchPlaceholder='Nomi qidirish...'
								disabled
							/>
						</FormField>
						<FormField label="O'lchami" horizontal={false}>
							<Combobox
								value={brandSize}
								onChange={handleBrandSizeChange}
								options={brandSizeOptions}
								selectedLabel={selectedBrandSize?.size}
								placeholder='Tanlang...'
								searchPlaceholder='Qidirish...'
								disabled
							/>
						</FormField>
						<FormField label='Tip' horizontal={false}>
							<Combobox
								value={type ? String(type) : ''}
								onChange={() => {}}
								options={[]}
								selectedLabel={type ? typeNameById.get(type) : undefined}
								placeholder='Tanlang...'
								disabled
							/>
						</FormField>

						<FormField label='Soni' horizontal={false}>
							<Input
								type='number'
								inputMode='numeric'
								value={count}
								onChange={(e) => setCount(e.target.value)}
							/>
						</FormField>
						<FormField label='Ishchi Uchun Narx ($)' horizontal={false}>
							<PriceInput value={workerPrice} onChange={setWorkerPrice} />
						</FormField>
					</div>

					<FormField label='Izoh' error={commentError} required horizontal={false}>
						<Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
					</FormField>

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
					<Button type='button' variant='primary' onClick={handleSubmit} disabled={updateMutation.isPending}>
						Saqlash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

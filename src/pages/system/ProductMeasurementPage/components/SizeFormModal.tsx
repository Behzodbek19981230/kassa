import { useState } from 'react';
import {
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	useNotification,
} from '@/components/ui';
import {
	useCreateBrandSizeMutation,
	useUpdateBrandSizeMutation,
} from '@/services/brand-size/brand-size.queries';
import type { BrandSize, BrandSizePayload } from '@/services/brand-size/brand-size.types';
import { useBrandSizeTypeListQuery } from '@/services/brand-size-type/brand-size-type.queries';
import { brandSizeTypeService } from '@/services/brand-size-type/brand-size-type.service';
import { useBrandListQuery } from '@/services/brand/brand.queries';
import { brandService } from '@/services/brand/brand.service';
import { useProductCategoryListQuery } from '@/services/product-category/product-category.queries';
import { productCategoryService } from '@/services/product-category/product-category.service';

interface SizeFormState {
	brand: string;
	product_category: string;
	type: string;
	size: string;
}

interface SizeFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: BrandSize;
}

export default function SizeFormModal({ open, setOpen, mode, item }: SizeFormModalProps) {
	const { notify } = useNotification();

	const { data: brandData } = useBrandListQuery({ limit: 100 });
	const brandNameById = new Map((brandData?.results ?? []).map((b) => [b.id, b.name]));

	const { data: categoryData } = useProductCategoryListQuery({ limit: 100 });
	const categoryNameById = new Map((categoryData?.results ?? []).map((c) => [c.id, c.name]));

	const { data: typeData } = useBrandSizeTypeListQuery({ limit: 100 });
	const typeNameById = new Map((typeData?.results ?? []).map((t) => [t.id, t.name]));

	const [form, setForm] = useState<SizeFormState>(
		mode === 'edit' && item
			? {
					brand: String(item.brand),
					product_category: String(item.product_category),
					type: String(item.type),
					size: item.size,
				}
			: { brand: '', product_category: '', type: '', size: '0' },
	);
	const [formError, setFormError] = useState('');

	const createMutation = useCreateBrandSizeMutation();
	const updateMutation = useUpdateBrandSizeMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const loadBrandOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await brandService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((b) => ({ value: String(b.id), label: b.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadCategoryOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		if (!form.brand) return { options: [], hasMore: false };
		const result = await productCategoryService.list({
			brand: Number(form.brand),
			search: search || undefined,
			page,
			limit: 20,
		});
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadTypeOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await brandSizeTypeService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.filter((t) => t.status).map((t) => ({ value: String(t.id), label: t.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const handleBrandChange = (value: string) => {
		setForm((f) => ({ ...f, brand: value, product_category: '' }));
	};

	const handleSubmit = async () => {
		if (!form.brand) {
			setFormError('Model tanlanishi shart');
			return;
		}
		if (!form.product_category) {
			setFormError('Mahsulot toifasi tanlanishi shart');
			return;
		}
		if (!form.type) {
			setFormError("O'lcham turi tanlanishi shart");
			return;
		}

		const payload: BrandSizePayload = {
			size: Number(form.size) || 0,
			type: Number(form.type),
			brand: Number(form.brand),
			product_category: Number(form.product_category),
		};

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: "O'lcham yangilandi" });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "O'lcham qo'shildi" });
			}
			setOpen(false);
		} catch {
			setFormError('Saqlashda xatolik yuz berdi');
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{mode === 'edit' ? "O'lchamni tahrirlash" : "O'lcham qo'shish"}</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{formError && (
						<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}
					<div className='mb-3'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Model</label>
						<Combobox
							value={form.brand}
							onChange={handleBrandChange}
							loadOptions={loadBrandOptions}
							selectedLabel={brandNameById.get(Number(form.brand))}
							placeholder='Tanlang...'
							searchPlaceholder='Model qidirish...'
						/>
					</div>

					<div className='mb-3'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Mahsulot toifasi</label>
						{form.brand ? (
							<Combobox
								value={form.product_category}
								onChange={(v) => setForm((f) => ({ ...f, product_category: v }))}
								loadOptions={loadCategoryOptions}
								selectedLabel={categoryNameById.get(Number(form.product_category))}
								placeholder='Tanlang...'
								searchPlaceholder='Toifa qidirish...'
							/>
						) : (
							<p className='text-xs text-ca-theme'>Avval brandni tanlang</p>
						)}
					</div>

					<div className='mb-3 grid grid-cols-2 gap-3'>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>Turi</label>
							<Combobox
								value={form.type}
								onChange={(v) => setForm((f) => ({ ...f, type: v }))}
								loadOptions={loadTypeOptions}
								selectedLabel={typeNameById.get(Number(form.type))}
								placeholder='Tanlang...'
								searchPlaceholder='Tur qidirish...'
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								O'lchami (Misol: 9.99)
							</label>
							<Input
								type='number'
								step='0.01'
								value={form.size}
								onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
							/>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
						Yopish
					</Button>
					<Button variant='primary' onClick={handleSubmit} disabled={isSaving}>
						Saqlash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

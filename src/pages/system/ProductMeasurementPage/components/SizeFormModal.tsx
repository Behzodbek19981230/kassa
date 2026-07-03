import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
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

const sizeFormSchema = z.object({
	brand: z.string().min(1, 'Model tanlanishi shart'),
	product_category: z.string().min(1, 'Mahsulot toifasi tanlanishi shart'),
	type: z.string().min(1, "O'lcham turi tanlanishi shart"),
	size: z.string(),
});

type SizeFormValues = z.infer<typeof sizeFormSchema>;

interface SizeFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: BrandSize;
}

export default function SizeFormModal({ open, setOpen, mode, item }: SizeFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const { data: brandData } = useBrandListQuery({ limit: 100 });
	const brandNameById = new Map((brandData?.results ?? []).map((b) => [b.id, b.name]));

	const { data: categoryData } = useProductCategoryListQuery({ limit: 100 });
	const categoryNameById = new Map((categoryData?.results ?? []).map((c) => [c.id, c.name]));

	const { data: typeData } = useBrandSizeTypeListQuery({ limit: 100 });
	const typeNameById = new Map((typeData?.results ?? []).map((t) => [t.id, t.name]));

	const {
		control,
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<SizeFormValues>({
		resolver: zodResolver(sizeFormSchema),
		defaultValues:
			mode === 'edit' && item
				? {
						brand: String(item.brand),
						product_category: String(item.product_category),
						type: String(item.type),
						size: item.size,
					}
				: { brand: '', product_category: '', type: '', size: '0' },
	});

	const brandValue = watch('brand');

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
		if (!brandValue) return { options: [], hasMore: false };
		const result = await productCategoryService.list({
			brand: Number(brandValue),
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

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const payload: BrandSizePayload = {
			size: Number(values.size) || 0,
			type: Number(values.type),
			brand: Number(values.brand),
			product_category: Number(values.product_category),
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
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{mode === 'edit' ? "O'lchamni tahrirlash" : "O'lcham qo'shish"}</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<FormField label='Model' error={errors.brand?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='brand'
								control={control}
								render={({ field }) => (
									<Combobox
										value={field.value}
										onChange={(v) => {
											field.onChange(v);
											setValue('product_category', '');
										}}
										loadOptions={loadBrandOptions}
										selectedLabel={brandNameById.get(Number(field.value))}
										placeholder='Tanlang...'
										searchPlaceholder='Model qidirish...'
									/>
								)}
							/>
						</FormField>

						<FormField
							label='Mahsulot toifasi'
							error={errors.product_category?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							{brandValue ? (
								<Controller
									name='product_category'
									control={control}
									render={({ field }) => (
										<Combobox
											value={field.value}
											onChange={field.onChange}
											loadOptions={loadCategoryOptions}
											selectedLabel={categoryNameById.get(Number(field.value))}
											placeholder='Tanlang...'
											searchPlaceholder='Toifa qidirish...'
										/>
									)}
								/>
							) : (
								<p className='text-xs text-ca-theme'>Avval brandni tanlang</p>
							)}
						</FormField>

						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField label='Turi' error={errors.type?.message} required horizontal={false} className='mb-0'>
								<Controller
									name='type'
									control={control}
									render={({ field }) => (
										<Combobox
											value={field.value}
											onChange={field.onChange}
											loadOptions={loadTypeOptions}
											selectedLabel={typeNameById.get(Number(field.value))}
											placeholder='Tanlang...'
											searchPlaceholder='Tur qidirish...'
										/>
									)}
								/>
							</FormField>
							<FormField
								label="O'lchami (Misol: 9.99)"
								error={errors.size?.message}
								horizontal={false}
								className='mb-0'
							>
								<Input type='number' step='0.01' {...register('size')} />
							</FormField>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Yopish
						</Button>
						<Button type='submit' variant='primary' disabled={isSaving}>
							Saqlash
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}

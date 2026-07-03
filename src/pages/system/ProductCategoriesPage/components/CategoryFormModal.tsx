import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaPlus, FaTrash } from 'react-icons/fa';
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
	useDeleteBrandSizeMutation,
	useUpdateBrandSizeMutation,
} from '@/services/brand-size/brand-size.queries';
import { brandSizeService } from '@/services/brand-size/brand-size.service';
import type { BrandSizePayload } from '@/services/brand-size/brand-size.types';
import { useBrandSizeTypeListQuery } from '@/services/brand-size-type/brand-size-type.queries';
import { brandSizeTypeService } from '@/services/brand-size-type/brand-size-type.service';
import { useBrandListQuery } from '@/services/brand/brand.queries';
import { brandService } from '@/services/brand/brand.service';
import {
	useCreateProductCategoryMutation,
	useUpdateProductCategoryMutation,
} from '@/services/product-category/product-category.queries';
import { productCategoryService } from '@/services/product-category/product-category.service';
import type { ProductCategory, ProductCategoryPayload } from '@/services/product-category/product-category.types';

const categoryFormSchema = z.object({
	name: z.string().min(1, 'Nomi kiritilishi shart'),
	sorting: z.string(),
	brand: z.string().min(1, 'Model tanlanishi shart'),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface SizeRowState {
	id?: number;
	size: string;
	type: string;
}

const emptySizeRow: SizeRowState = { size: '0', type: '' };

interface CategoryFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: ProductCategory;
}

export default function CategoryFormModal({ open, setOpen, mode, item }: CategoryFormModalProps) {
	const { notify } = useNotification();

	const { data: brandData } = useBrandListQuery({ limit: 100 });
	const brandNameById = new Map((brandData?.results ?? []).map((b) => [b.id, b.name]));

	const { data: sizeTypeData } = useBrandSizeTypeListQuery({ limit: 100 });
	const sizeTypeNameById = new Map((sizeTypeData?.results ?? []).map((t) => [t.id, t.name]));

	const {
		control,
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<CategoryFormValues>({
		resolver: zodResolver(categoryFormSchema),
		defaultValues:
			mode === 'edit' && item
				? { name: item.name, sorting: String(item.sorting), brand: String(item.brand) }
				: { name: '', sorting: '0', brand: '' },
	});

	const brandValue = watch('brand');

	const [sizeRows, setSizeRows] = useState<SizeRowState[]>([{ ...emptySizeRow }]);
	const [removedSizeIds, setRemovedSizeIds] = useState<number[]>([]);
	const [formError, setFormError] = useState('');
	const [sortingHint, setSortingHint] = useState('');

	const createMutation = useCreateProductCategoryMutation();
	const updateMutation = useUpdateProductCategoryMutation();
	const createSizeMutation = useCreateBrandSizeMutation();
	const updateSizeMutation = useUpdateBrandSizeMutation();
	const deleteSizeMutation = useDeleteBrandSizeMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		if (mode !== 'edit' || !item) return;
		brandSizeService.list({ product_category: item.id }).then((existingSizes) => {
			setSizeRows(
				existingSizes.results.length
					? existingSizes.results.map((s) => ({ id: s.id, size: s.size, type: String(s.type) }))
					: [{ ...emptySizeRow }],
			);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const loadBrandOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await brandService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((b) => ({ value: String(b.id), label: b.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadSizeTypeOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await brandSizeTypeService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.filter((t) => t.status).map((t) => ({ value: String(t.id), label: t.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const handleBrandChange = async (value: string) => {
		setValue('brand', value);
		if (mode !== 'create' || !value) return;
		try {
			const { first_empty_sorting, message } = await productCategoryService.getNextSorting(Number(value));
			setValue('sorting', String(first_empty_sorting));
			setSortingHint(message);
		} catch {
			// keep existing sorting if the suggestion request fails
		}
	};

	const updateSizeRow = (index: number, patch: Partial<SizeRowState>) => {
		setSizeRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
	};

	const addSizeRow = () => {
		setSizeRows((rows) => [...rows, { ...emptySizeRow }]);
	};

	const removeSizeRow = (index: number) => {
		setSizeRows((rows) => {
			const row = rows[index];
			if (row.id) setRemovedSizeIds((ids) => [...ids, row.id!]);
			return rows.filter((_, i) => i !== index);
		});
	};

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');

		const validRows = sizeRows.filter((row) => row.type && Number(row.size) > 0);
		if (validRows.length === 0) {
			setFormError("Kamida bitta o'lcham va tur qo'shilishi shart");
			return;
		}

		const brand = Number(values.brand);
		const payload: ProductCategoryPayload = {
			name: values.name.trim(),
			sorting: Number(values.sorting) || 0,
			status: 1,
			sup_status: 1,
			brand,
		};

		try {
			const categoryId =
				mode === 'edit' && item
					? (await updateMutation.mutateAsync({ id: item.id, payload })).id
					: (await createMutation.mutateAsync(payload)).id;

			await Promise.all(removedSizeIds.map((id) => deleteSizeMutation.mutateAsync(id)));

			await Promise.all(
				validRows.map((row) => {
					const sizePayload: BrandSizePayload = {
						size: Number(row.size),
						type: Number(row.type),
						brand,
						product_category: categoryId,
					};
					return row.id
						? updateSizeMutation.mutateAsync({ id: row.id, payload: sizePayload })
						: createSizeMutation.mutateAsync(sizePayload);
				}),
			);

			notify({ title: mode === 'edit' ? 'Mahsulot toifasi yangilandi' : "Mahsulot toifasi qo'shildi" });
			setOpen(false);
		} catch {
			setFormError('Saqlashda xatolik yuz berdi');
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{mode === 'edit' ? 'Tahrirlash' : 'Yaratish'}</ModalTitle>
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
											void handleBrandChange(v);
										}}
										loadOptions={loadBrandOptions}
										selectedLabel={brandNameById.get(Number(field.value))}
										placeholder='Tanlang...'
										searchPlaceholder='Model qidirish...'
									/>
								)}
							/>
						</FormField>

						<div className='mb-3 grid grid-cols-2 gap-3'>
							<FormField
								label='Tartibi'
								error={errors.sorting?.message}
								horizontal={false}
								className='mb-0'
							>
								<Input type='number' {...register('sorting')} />
								{sortingHint && <i className='mt-1 block text-xs text-ca-text'>{sortingHint}</i>}
							</FormField>
							<FormField label='Nomi' error={errors.name?.message} required horizontal={false} className='mb-0'>
								<Input {...register('name')} />
							</FormField>
						</div>

						{!brandValue ? (
							<p className='text-xs text-ca-theme'>Avval brandni tanlang</p>
						) : (
							<div className='border-t border-ca-border pt-3'>
								<div className='mb-2 grid grid-cols-[1fr_1fr_32px] gap-3'>
									<label className='text-xs font-semibold text-ca-heading'>
										O'lchami (Misol: 9.99)
										<span className='text-ca-red'> *</span>
									</label>
									<label className='text-xs font-semibold text-ca-heading'>
										Tip
										<span className='text-ca-red'> *</span>
									</label>
									<span />
								</div>
								{sizeRows.map((row, index) => (
									<div key={index} className='mb-2 grid grid-cols-[1fr_1fr_32px] items-center gap-3'>
										<Input
											type='number'
											step='0.01'
											value={row.size}
											onChange={(e) => updateSizeRow(index, { size: e.target.value })}
										/>
										<Combobox
											value={row.type}
											onChange={(v) => updateSizeRow(index, { type: v })}
											loadOptions={loadSizeTypeOptions}
											selectedLabel={sizeTypeNameById.get(Number(row.type))}
											placeholder='Tanlang...'
											searchPlaceholder='Tur qidirish...'
										/>
										{index === sizeRows.length - 1 ? (
											<Button
												variant='default'
												size='icon'
												type='button'
												onClick={addSizeRow}
												aria-label="Qator qo'shish"
											>
												<FaPlus />
											</Button>
										) : (
											<Button
												variant='danger'
												size='icon'
												type='button'
												onClick={() => removeSizeRow(index)}
												aria-label="Qatorni o'chirish"
											>
												<FaTrash />
											</Button>
										)}
									</div>
								))}
							</div>
						)}
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

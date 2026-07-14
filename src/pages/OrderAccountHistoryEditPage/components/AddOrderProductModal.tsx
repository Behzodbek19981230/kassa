import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaCartPlus } from 'react-icons/fa';
import { z } from 'zod';
import {
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	FormField,
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
import { formatNumber } from '@/lib/number';
import { brandService } from '@/services/brand/brand.service';
import { useCreateProductAccountHistoryMutation } from '@/services/product-account-history/product-account-history.queries';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useWarehouseAllListQuery } from '@/services/warehouse/warehouse.queries';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';

interface AddOrderProductModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	orderId: number;
	companyId: number;
}

const addProductFormSchema = z
	.object({
		brand: z.string().min(1, 'Modelni tanlang'),
		product_category: z.string().min(1, 'Nomini tanlang'),
		variant: z.string().min(1, "O'lchamini tanlang"),
		count: z
			.string()
			.min(1, 'Sonini kiriting')
			.refine((v) => Number(v) > 0, "Soni 0 dan katta bo'lishi kerak"),
		price: z.string().optional(),
	})
	.superRefine((values, ctx) => {
		if (!values.price || Number(values.price) <= 0) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price'], message: 'Narxni kiriting' });
		}
	});

type AddProductFormValues = z.infer<typeof addProductFormSchema>;

export default function AddOrderProductModal({ open, setOpen, orderId, companyId }: AddOrderProductModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<AddProductFormValues>({
		resolver: zodResolver(addProductFormSchema),
		defaultValues: { brand: '', product_category: '', variant: '', count: '', price: '' },
	});

	const brandValue = watch('brand');
	const categoryValue = watch('product_category');
	const variantValue = watch('variant');
	const countValue = watch('count');
	const priceValue = watch('price');

	const { data: variantGroups } = useWarehouseAllListQuery({
		company: companyId,
		brand: brandValue ? Number(brandValue) : undefined,
		product_category: categoryValue ? Number(categoryValue) : undefined,
	});

	const variantOptions = useMemo(() => {
		const rows: WarehouseAllListItem[] = [];
		for (const g of variantGroups ?? []) {
			for (const pc of g.product_categories) {
				rows.push(...pc.warehouses);
			}
		}
		return rows;
	}, [variantGroups]);

	const selectedVariant = variantOptions.find((row) => String(row.id) === variantValue);
	const lineTotal = (Number(countValue) || 0) * (Number(priceValue) || 0);

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

	function handleBrandChange(value: string) {
		setValue('brand', value);
		setValue('product_category', '');
		setValue('variant', '');
	}

	function handleCategoryChange(value: string) {
		setValue('product_category', value);
		setValue('variant', '');
	}

	function handleVariantChange(value: string) {
		setValue('variant', value);
		const row = variantOptions.find((r) => String(r.id) === value);
		if (row) setValue('price', String(row.price));
	}

	const createMutation = useCreateProductAccountHistoryMutation();

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		if (!selectedVariant) {
			setFormError("O'lchamini tanlang");
			return;
		}

		try {
			await createMutation.mutateAsync({
				order_account_history: orderId,
				warehouse: selectedVariant.id,
				count: Number(values.count),
				price: values.price || '0',
			});
			notify({ title: "Mahsulot buyurtmaga qo'shildi" });
			setOpen(false);
		} catch (err) {
			setFormError(getApiErrorMessage(err, "Qo'shishda xatolik yuz berdi"));
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-[500px]'>
				<ModalHeader>
					<ModalTitle>Buyurtmaga mahsulot qo'shish</ModalTitle>
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
										onChange={handleBrandChange}
										loadOptions={loadBrandOptions}
										placeholder='Tanlang...'
										searchPlaceholder='Model qidirish...'
									/>
								)}
							/>
						</FormField>

						<FormField label='Nomi' error={errors.product_category?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='product_category'
								control={control}
								render={({ field }) => (
									<Combobox
										value={field.value}
										onChange={handleCategoryChange}
										loadOptions={loadCategoryOptions}
										placeholder='Tanlang...'
										searchPlaceholder='Nomi qidirish...'
										disabled={!brandValue}
									/>
								)}
							/>
						</FormField>

						<FormField
							label="O'lchami / Joyi"
							error={errors.variant?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Controller
								name='variant'
								control={control}
								render={({ field }) => (
									<Combobox
										value={field.value}
										onChange={handleVariantChange}
										options={variantOptions.map((row) => ({
											value: String(row.id),
											label: `${formatNumber(row.size)} ${row.type_name ?? ''} — ${row.type_sklad_name ?? 'Dokon'} (${formatNumber(row.count)} ta)`,
										}))}
										placeholder='Tanlang...'
										searchPlaceholder='Qidirish...'
										disabled={!categoryValue}
									/>
								)}
							/>
						</FormField>

						<FormField label='Soni' error={errors.count?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='count'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>

						<FormField label='Narxi ($)' error={errors.price?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='price'
								control={control}
								render={({ field }) => <PriceInput value={field.value} onChange={field.onChange} />}
							/>
						</FormField>

						{lineTotal > 0 && (
							<div className='flex items-center justify-between rounded-[3px] border border-ca-border bg-[#f8fafc] px-3 py-2 text-xs'>
								<span className='text-ca-text'>Umumiy narxi</span>
								<span className='text-sm font-bold text-ca-green'>{formatNumber(lineTotal, 2)} $</span>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='danger' disabled={createMutation.isPending}>
							<FaCartPlus className='mr-1.5' /> Qo'shish
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}

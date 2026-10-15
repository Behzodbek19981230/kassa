import { useEffect, useState, type FormEvent } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import {
	Button,
	DatePicker,
	Input,
	MultiCombobox,
	PageHeader,
	Panel,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	useNotification,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { usePermissions } from '@/lib/permissions';
import { generateId } from '@/lib/utils';
import WarehouseProductRow, {
	emptyWarehouseRow,
	type WarehouseRowValue,
} from '@/pages/WarehousePage/components/WarehouseProductRow';
import { useSkladProductQuery, useUpdateSkladProductMutation } from '@/services/sklad-product/sklad-product.queries';
import { skladTypeService } from '@/services/sklad-type/sklad-type.service';
import { useBulkCreateWarehouseMutation } from '@/services/warehouse/warehouse.queries';

interface WarehouseFormPageProps {
	mode: 'create' | 'edit';
}

export default function WarehouseFormPage({ mode }: WarehouseFormPageProps) {
	const navigate = useNavigate();
	const { id } = useParams();
	// In edit mode the route id is a SkladProduct (one product's price in one sklad).
	const skladProductId = id ? Number(id) : undefined;

	const { notify } = useNotification();
	const { companyId, canWrite } = useCurrentCompany();
	const { canManageWarehouse } = usePermissions();
	const skladProductQuery = useSkladProductQuery(mode === 'edit' ? skladProductId : undefined);

	useEffect(() => {
		if (!canWrite || !canManageWarehouse) navigate('/warehouse-prices', { replace: true });
	}, [canWrite, canManageWarehouse, navigate]);

	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [comment, setComment] = useState('');
	// One sklad choice for the whole form (create mode): every product below is added to each of them.
	const [skladIds, setSkladIds] = useState<string[]>([]);
	const [rows, setRows] = useState<WarehouseRowValue[]>([emptyWarehouseRow()]);
	const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
	const [formError, setFormError] = useState('');
	const [duplicateRowKeys, setDuplicateRowKeys] = useState<Record<string | number, boolean>>({});

	const bulkCreateMutation = useBulkCreateWarehouseMutation();
	const updateStockMutation = useUpdateSkladProductMutation();
	const isSaving = bulkCreateMutation.isPending || updateStockMutation.isPending;

	const company = (mode === 'edit' ? skladProductQuery.data?.company : undefined) ?? companyId ?? undefined;
	const hasDuplicate = Object.values(duplicateRowKeys).some(Boolean);

	const handleDuplicateChange = (key: string | number, isDuplicate: boolean) => {
		setDuplicateRowKeys((prev) => {
			if (isDuplicate === Boolean(prev[key])) return prev;
			return { ...prev, [key]: isDuplicate };
		});
	};

	useEffect(() => {
		const stock = skladProductQuery.data;
		const card = stock?.warehouse_detail;
		if (mode === 'edit' && stock && card) {
			if (stock.cr_date) setDate(stock.cr_date);
			setRows([
				{
					key: generateId(),
					brand: String(card.brand),
					product_category: String(card.product_category),
					brandSize: '',
					size: Number(card.size),
					type: card.type,
					type_sklad: String(stock.type_sklad),
					price: String(stock.real_price ?? ''),
				},
			]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, skladProductQuery.data]);

	const updateRow = (index: number, next: WarehouseRowValue) => {
		setRows((prev) => prev.map((row, i) => (i === index ? next : row)));
	};
	const addRow = () => setRows((prev) => [...prev, emptyWarehouseRow()]);
	const removeRow = (index: number) => {
		const removedKey = rows[index]?.key;
		if (removedKey !== undefined) {
			setDuplicateRowKeys((keys) => {
				const { [removedKey]: _removed, ...rest } = keys;
				return rest;
			});
		}
		setRows((prev) => prev.filter((_, i) => i !== index));
	};

	const loadSkladTypeOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await skladTypeService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((s) => ({ value: String(s.id), label: s.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	// Model/nomi/o'lcham lists are narrowed by the sklad only while exactly one is picked, so the rows
	// start over when that narrowing appears or goes away.
	const handleSkladIdsChange = (next: string[]) => {
		if (next.length === 1 || skladIds.length === 1) {
			setRows((prev) => prev.map((row) => ({ ...emptyWarehouseRow(), key: row.key, price: row.price })));
		}
		setSkladIds(next);
	};

	const goBack = () => navigate('/warehouse-prices');

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setFormError('');

		if (!company) {
			setFormError('Tashkilot topilmadi');
			return;
		}
		if (!date) {
			setFormError('Sana kiritilishi shart');
			return;
		}
		if (hasDuplicate) {
			setFormError("Bu mahsulot ushbu skladga oldin qo'shilgan");
			return;
		}

		if (mode === 'create' && skladIds.length === 0) {
			setFormError('Kamida bitta sklad tanlang');
			return;
		}

		const errors: Record<number, string> = {};
		rows.forEach((row, i) => {
			if (!row.brand || !row.product_category || !row.brandSize || !row.price || (mode === 'edit' && !row.type_sklad)) {
				errors[i] = "Barcha maydonlar to'ldirilishi shart";
			}
		});
		if (Object.keys(errors).length) {
			setRowErrors(errors);
			return;
		}
		setRowErrors({});

		try {
			if (mode === 'edit' && skladProductId) {
				// The product and sklad of a stock row are fixed; only its price and date change here.
				await updateStockMutation.mutateAsync({
					id: skladProductId,
					payload: { real_price: rows[0].price, cr_date: date },
				});
				notify({ title: 'Tovar yangilandi' });
			} else {
				// The backend finds or creates each product card and adds it to every chosen sklad in one transaction.
				await bulkCreateMutation.mutateAsync({
								type_sklads: skladIds.map(Number),
					cr_date: date,
					comment: comment.trim() || undefined,
					items: rows.map((row) => ({
						brand: Number(row.brand),
						product_category: Number(row.product_category),
						type: row.type,
						size: row.size ?? 0,
						real_price: row.price,
					})),
				});
				notify({ title: "Tovar(lar) qo'shildi" });
			}
			goBack();
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
		}
	};

	const title = mode === 'edit' ? 'Tovarni tahrirlash' : "Tovar qo'shish";

	return (
		<>
			<PageHeader
				title={title}
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: title, active: true },
				]}
			/>

			<Panel
				title={title}
				actions={
					<Button type='button' variant='warning' size='xs' onClick={goBack}>
						<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
					</Button>
				}
			>
				<form onSubmit={handleSubmit} noValidate>
					{formError && (
						<div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}

					<div className='mb-4 flex flex-wrap items-start gap-3'>
						<div className='w-full max-w-xs'>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>Sana</label>
							<DatePicker value={date} onChange={setDate} />
						</div>
						{mode === 'create' && (
							<div className='min-w-64 flex-1'>
								<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								Sklad <span className='text-ca-red'>*</span>
								</label>
								<MultiCombobox
								value={skladIds}
								onChange={handleSkladIdsChange}
								loadOptions={loadSkladTypeOptions}
								placeholder='Tanlang...'
								searchPlaceholder='Qidirish...'
								/>
							</div>
						)}
					</div>

					{rows.map((row, index) => (
						<WarehouseProductRow
							key={row.key}
							value={row}
							onChange={(next) => updateRow(index, next)}
							error={rowErrors[index]}
							showAdd={mode === 'create' && index === rows.length - 1}
							onAdd={addRow}
							showRemove={mode === 'create' && rows.length > 1}
							onRemove={() => removeRow(index)}
							companyId={company}
							skladIds={mode === 'create' ? skladIds : undefined}
							excludeId={mode === 'edit' ? skladProductId : undefined}
							onDuplicateChange={handleDuplicateChange}
						/>
					))}

					<div className='mt-4 mb-4'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Izoh</label>
						<Input value={comment} onChange={(e) => setComment(e.target.value)} />
					</div>

					<Button
						type='submit'
						variant='theme'
						className='h-11 w-full text-sm'
						loading={isSaving}
						disabled={hasDuplicate}
					>
						{mode === 'edit' ? 'Saqlash' : "Qo'shish"}
					</Button>
				</form>
			</Panel>
		</>
	);
}

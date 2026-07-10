import { useEffect, useState, type FormEvent } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, DatePicker, Input, PageHeader, Panel, useNotification } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { generateId } from '@/lib/utils';
import WarehouseProductRow, {
	emptyWarehouseRow,
	type WarehouseRowValue,
} from '@/pages/WarehousePage/components/WarehouseProductRow';
import {
	useCreateWarehouseMutation,
	useUpdateWarehouseMutation,
	useWarehouseQuery,
} from '@/services/warehouse/warehouse.queries';
import type { WarehousePayload } from '@/services/warehouse/warehouse.types';

interface WarehouseFormPageProps {
	mode: 'create' | 'edit';
}

export default function WarehouseFormPage({ mode }: WarehouseFormPageProps) {
	const navigate = useNavigate();
	const { id } = useParams();
	const warehouseId = id ? Number(id) : undefined;

	const { notify } = useNotification();
	const { companyId } = useCurrentCompany();
	const warehouseQuery = useWarehouseQuery(mode === 'edit' ? warehouseId : undefined);

	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [comment, setComment] = useState('');
	const [rows, setRows] = useState<WarehouseRowValue[]>([emptyWarehouseRow()]);
	const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
	const [formError, setFormError] = useState('');
	const [duplicateRowKeys, setDuplicateRowKeys] = useState<Record<string | number, boolean>>({});

	const createMutation = useCreateWarehouseMutation();
	const updateMutation = useUpdateWarehouseMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const company = (mode === 'edit' ? warehouseQuery.data?.company : undefined) ?? companyId ?? undefined;
	const hasDuplicate = Object.values(duplicateRowKeys).some(Boolean);

	const handleDuplicateChange = (key: string | number, isDuplicate: boolean) => {
		setDuplicateRowKeys((prev) => {
			if (isDuplicate === Boolean(prev[key])) return prev;
			return { ...prev, [key]: isDuplicate };
		});
	};

	useEffect(() => {
		const w = warehouseQuery.data;
		if (mode === 'edit' && w) {
			setDate(w.cr_date);
			setComment(w.comment ?? '');
			setRows([
				{
					key: generateId(),
					brand: String(w.brand),
					product_category: String(w.product_category),
					brandSize: '',
					size: Number(w.size),
					type: w.type,
					type_sklad: w.type_sklad ? String(w.type_sklad) : '',
					price: String(w.price),
				},
			]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, warehouseQuery.data]);

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
			setFormError('Bu tovar bazada mavjud');
			return;
		}

		const errors: Record<number, string> = {};
		rows.forEach((row, i) => {
			if (!row.brand || !row.product_category || !row.brandSize || !row.price || !row.type_sklad) {
				errors[i] = "Barcha maydonlar to'ldirilishi shart";
			}
		});
		if (Object.keys(errors).length) {
			setRowErrors(errors);
			return;
		}
		setRowErrors({});

		try {
			if (mode === 'edit' && warehouseId) {
				const row = rows[0];
				const w = warehouseQuery.data;
				const payload: WarehousePayload = {
					cr_date: date,
					size: row.size ?? 0,
					count: 0,
					price: Number(row.price) || 0,
					worker_price: w?.worker_price ?? 0,
					status_count: w?.status_count ?? false,
					company,
					brand: Number(row.brand),
					product_category: Number(row.product_category),
					type: row.type,
					type_sklad: row.type_sklad ? Number(row.type_sklad) : null,
					all_sum_dollar: w?.all_sum_dollar ?? 0,
					all_discount_amount: w?.all_discount_amount ?? 0,
					all_my_total_debt: w?.all_my_total_debt ?? 0,
					comment: comment || undefined,
				};
				await updateMutation.mutateAsync({ id: warehouseId, payload });
				notify({ title: 'Tovar yangilandi' });
			} else {
				for (const row of rows) {
					const payload: WarehousePayload = {
						cr_date: date,
						size: row.size ?? 0,
						count: 0,
						price: Number(row.price) || 0,
						worker_price: 0,
						status_count: false,
						company,
						brand: Number(row.brand),
						product_category: Number(row.product_category),
						type: row.type,
						type_sklad: row.type_sklad ? Number(row.type_sklad) : null,
						all_sum_dollar: 0,
						all_discount_amount: 0,
						all_my_total_debt: 0,
						comment: comment || undefined,
					};
					await createMutation.mutateAsync(payload);
				}
				notify({ title: "Tovar(lar) qo'shildi" });
			}
			goBack();
		} catch {
			setFormError('Saqlashda xatolik yuz berdi');
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
						<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}

					<div className='mb-4 max-w-xs'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Sana</label>
						<DatePicker value={date} onChange={setDate} />
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
							excludeId={mode === 'edit' ? warehouseId : undefined}
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
						disabled={isSaving || hasDuplicate}
					>
						{mode === 'edit' ? 'Saqlash' : "Qo'shish"}
					</Button>
				</form>
			</Panel>
		</>
	);
}

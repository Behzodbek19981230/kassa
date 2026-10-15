import { useEffect, useState, type FormEvent } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, DatePicker, Input, PageHeader, Panel, useNotification } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { usePermissions } from '@/lib/permissions';
import { generateId } from '@/lib/utils';
import WarehouseProductRow, {
	emptyWarehouseRow,
	type WarehouseRowValue,
} from '@/pages/WarehousePage/components/WarehouseProductRow';
import {
	useCreateSkladProductMutation,
	useSkladProductQuery,
	useUpdateSkladProductMutation,
} from '@/services/sklad-product/sklad-product.queries';
import { useCreateWarehouseMutation } from '@/services/warehouse/warehouse.queries';
import { warehouseService } from '@/services/warehouse/warehouse.service';
import type { WarehousePayload } from '@/services/warehouse/warehouse.types';

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
	const [rows, setRows] = useState<WarehouseRowValue[]>([emptyWarehouseRow()]);
	const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
	const [formError, setFormError] = useState('');
	const [duplicateRowKeys, setDuplicateRowKeys] = useState<Record<string | number, boolean>>({});

	const createCardMutation = useCreateWarehouseMutation();
	const createStockMutation = useCreateSkladProductMutation();
	const updateStockMutation = useUpdateSkladProductMutation();
	const [isResolvingCards, setIsResolvingCards] = useState(false);
	const isSaving =
		isResolvingCards ||
		createCardMutation.isPending ||
		createStockMutation.isPending ||
		updateStockMutation.isPending;

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
			if (mode === 'edit' && skladProductId) {
				// The product and sklad of a stock row are fixed; only its price and date change here.
				await updateStockMutation.mutateAsync({
					id: skladProductId,
					payload: { real_price: rows[0].price, cr_date: date },
				});
				notify({ title: 'Tovar yangilandi' });
			} else {
				for (const row of rows) {
					const variant = {
						brand: Number(row.brand),
						product_category: Number(row.product_category),
						type: row.type,
						size: row.size ?? 0,
					};
					// The card is shared by every sklad, so an existing one is reused.
					setIsResolvingCards(true);
					let card = await warehouseService.findCard(variant).finally(() => setIsResolvingCards(false));
					if (!card) {
						const cardPayload: WarehousePayload = {
							...variant,
							cr_date: date,
							count: 0,
							price: 0,
							worker_price: 0,
							status_count: false,
							company,
							type_sklad: null,
							comment: comment || undefined,
						};
						card = await createCardMutation.mutateAsync(cardPayload);
					}
					await createStockMutation.mutateAsync({
						warehouse: card.id,
						type_sklad: Number(row.type_sklad),
						count: 0,
						real_price: row.price,
						cr_date: date,
						status_count: false,
					});
				}
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

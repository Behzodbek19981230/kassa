import { useEffect, useState, type FormEvent } from 'react';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Combobox, DatePicker, Input, PageHeader, Panel, PriceInput, useNotification } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage, UserFacingError } from '@/lib/errors';
import { generateId } from '@/lib/utils';
import WarehouseProductRow, {
	emptyWarehouseRow,
	type WarehouseRowValue,
} from '@/pages/WarehousePage/components/WarehouseProductRow';
import { useSkladViewQuery, useUpdateSkladMutation } from '@/services/sklad/sklad.queries';
import type { SkladUpdatePayload } from '@/services/sklad/sklad.types';
import { resolveStockId } from '@/services/sklad-product/catalog-stock';
import {
	useCreateSkladProductMutation,
	useDeleteSkladProductMutation,
	useUpdateSkladProductMutation,
} from '@/services/sklad-product/sklad-product.queries';
import { skladProductService } from '@/services/sklad-product/sklad-product.service';
import { warehouseService } from '@/services/warehouse/warehouse.service';

// A line of the import: one product's stock in one sklad (SkladProduct).
interface EditableRow extends WarehouseRowValue {
	/** The stock row the line was loaded with; new lines have none. */
	skladProductId?: number;
	/** The product card the line was loaded with. */
	cardId?: number;
}

export default function WarehouseAccountEditPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const skladId = id ? Number(id) : undefined;
	const { notify } = useNotification();
	const { canWrite } = useCurrentCompany();

	useEffect(() => {
		if (!canWrite) navigate('/warehouse-report', { replace: true });
	}, [canWrite, navigate]);

	const { data, isLoading, isError } = useSkladViewQuery(skladId);

	const [date, setDate] = useState('');
	const [exchangeRate, setExchangeRate] = useState('');
	const [givenSumDollar, setGivenSumDollar] = useState('');
	const [discountAmount, setDiscountAmount] = useState('');
	const [carNumber, setCarNumber] = useState('');
	const [comment, setComment] = useState('');
	const [rows, setRows] = useState<EditableRow[]>([]);
	const [removedRows, setRemovedRows] = useState<EditableRow[]>([]);
	const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
	const [unmatchedRowKeys, setUnmatchedRowKeys] = useState<Record<string | number, boolean>>({});
	const [formError, setFormError] = useState('');

	const updateSkladMutation = useUpdateSkladMutation();
	const createStockMutation = useCreateSkladProductMutation();
	const updateStockMutation = useUpdateSkladProductMutation();
	const deleteStockMutation = useDeleteSkladProductMutation();
	const [isResolving, setIsResolving] = useState(false);
	const isSaving =
		isResolving ||
		updateSkladMutation.isPending ||
		createStockMutation.isPending ||
		updateStockMutation.isPending ||
		deleteStockMutation.isPending;

	const hasUnmatchedRow = Object.values(unmatchedRowKeys).some(Boolean);

	useEffect(() => {
		if (!data) return;
		setDate(data.sklad.cr_date);
		setExchangeRate(String(data.report.exchange_rate));
		setGivenSumDollar(String(data.report.given_sum_dollar));
		setDiscountAmount(String(data.report.discount_amount));
		setCarNumber(data.sklad.car_number ?? '');
		setComment(data.sklad.comment ?? '');
		const items = data.products.groups.flatMap((g) => g.items);
		setRows(
			items.map((item) => ({
				key: generateId(),
				skladProductId: item.sklad_product ?? undefined,
				cardId: item.warehouse,
				brand: String(item.brand),
				product_category: String(item.product_category),
				brandSize: '',
				size: item.size,
				type: item.type,
				type_sklad: String(item.type_sklad),
				price: String(item.price),
				count: item.count,
			})),
		);
		setRemovedRows([]);
	}, [data]);

	const handleCatalogMatchChange = (key: string | number, matched: boolean) => {
		setUnmatchedRowKeys((prev) => {
			const isUnmatched = !matched;
			if (isUnmatched === Boolean(prev[key])) return prev;
			return { ...prev, [key]: isUnmatched };
		});
	};

	const updateRow = (index: number, next: EditableRow) => {
		setRows((prev) => prev.map((row, i) => (i === index ? next : row)));
	};
	const addRow = () => setRows((prev) => [...prev, { ...emptyWarehouseRow(), count: null }]);
	const removeRow = (index: number) => {
		const row = rows[index];
		if (row?.cardId) {
			setRemovedRows((prev) => [...prev, row]);
		}
		if (row?.key !== undefined) {
			setUnmatchedRowKeys((keys) => {
				const { [row.key]: _removed, ...rest } = keys;
				return rest;
			});
		}
		setRows((prev) => prev.filter((_, i) => i !== index));
	};

	const goBack = () => navigate('/warehouse-report');

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setFormError('');
		if (!data) return;

		if (!date) {
			setFormError('Sana kiritilishi shart');
			return;
		}
		if (!exchangeRate || Number(exchangeRate) <= 0) {
			setFormError('Dollar kursi kiritilishi shart');
			return;
		}
		if (!comment.trim()) {
			setFormError("O'zgargan mahsulotlar bo'yicha izoh kiritilishi shart");
			return;
		}
		if (rows.length === 0) {
			setFormError('Kamida bitta mahsulot qatori kiritilishi shart');
			return;
		}
		if (hasUnmatchedRow) {
			setFormError("Bu tovar bazada topilmadi. Tovarlar va narxlarga o'tib bu tovarni qo'shing");
			return;
		}

		const errors: Record<number, string> = {};
		rows.forEach((row, i) => {
			if (!row.brand || !row.product_category || !row.brandSize || !row.price || !row.type_sklad) {
				errors[i] = "Barcha maydonlar to'ldirilishi shart";
			} else if (!row.count || row.count <= 0) {
				errors[i] = 'Soni kiritilishi shart';
			}
		});
		if (Object.keys(errors).length) {
			setRowErrors(errors);
			return;
		}
		setRowErrors({});

		const company = data.sklad.company;

		try {
			const skladPayload: SkladUpdatePayload = {
				cr_date: date,
				exchange_rate: Number(exchangeRate) || 0,
				sum_dollar: Number(data.report.sum_dollar) || 0,
				sum_som: Number(data.report.sum_som) || 0,
				discount_amount: Number(discountAmount) || 0,
				given_sum_dollar: Number(givenSumDollar) || 0,
				car_number: carNumber.trim() || undefined,
				comment: comment.trim() || undefined,
				company,
				consignor_ref: data.sklad.consignor,
			};
			await updateSkladMutation.mutateAsync({ id: skladId!, payload: skladPayload });

			for (const row of rows) {
				setIsResolving(true);
				const typeSklad = Number(row.type_sklad);
				const stockPayload = { count: row.count ?? 0, real_price: row.price, cr_date: date };
				// The product card must already exist (the row checks that); its stock row in this sklad may not.
				const stock = await (async () => {
					const card = await warehouseService.findCard({
						brand: Number(row.brand),
						product_category: Number(row.product_category),
						type: row.type,
						size: row.size ?? 0,
					});
					if (!card) return { cardId: undefined, stockId: undefined };
					const sameStock = card.id === row.cardId && String(typeSklad) === row.type_sklad;
					const existing =
						sameStock && row.skladProductId
							? row.skladProductId
							: (await skladProductService.findByPair(card.id, typeSklad))?.id;
					return { cardId: card.id, stockId: existing };
				})().finally(() => setIsResolving(false));

				if (!stock.cardId) throw new UserFacingError("Bu tovar bazada topilmadi. Tovarlar va narxlarga o'tib bu tovarni qo'shing");
				if (stock.stockId) {
					await updateStockMutation.mutateAsync({ id: stock.stockId, payload: stockPayload });
				} else {
					await createStockMutation.mutateAsync({ warehouse: stock.cardId, type_sklad: typeSklad, ...stockPayload });
				}
			}

			for (const row of removedRows) {
				setIsResolving(true);
				const stockId = await resolveStockId(row.skladProductId, row.cardId!, Number(row.type_sklad)).finally(() =>
					setIsResolving(false),
				);
				// No stock row in that sklad means there is nothing to remove.
				if (stockId) await deleteStockMutation.mutateAsync(stockId);
			}

			notify({ title: 'Tovar yangilandi' });
			goBack();
		} catch (err) {
			setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
		}
	};

	if (isLoading) {
		return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>;
	}

	if (isError || !data) {
		return (
			<div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
				<FaExclamationTriangle /> Sklad topilmadi
			</div>
		);
	}

	return (
		<>
			<PageHeader
				title="Tovar qo'shish"
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: "Tovar qo'shish", active: true },
				]}
			/>

			<Panel
				title="Tovar qo'shish"
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

					<div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4'>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								Yuk jo'natuvchi <span className='text-ca-red'>(Kiritilish majburiy)</span>
							</label>
							<Combobox
								value={String(data.sklad.consignor)}
								onChange={() => {}}
								options={[]}
								selectedLabel={data.sklad.consignor_name}
								disabled
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								Mening qarzim ($)
							</label>
							<PriceInput value={data.report.my_total_debt} disabled />
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								Sana <span className='text-ca-red'>*</span>
							</label>
							<DatePicker value={date} onChange={setDate} />
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>
								Dollar kursi <span className='text-ca-red'>*</span>
							</label>
							<PriceInput value={exchangeRate} onChange={setExchangeRate} />
						</div>
					</div>

					{rows.map((row, index) => (
						<WarehouseProductRow
							key={row.key}
							value={row}
							onChange={(next) => updateRow(index, next as EditableRow)}
							error={rowErrors[index]}
							showAdd={index === rows.length - 1}
							onAdd={addRow}
							showRemove
							onRemove={() => removeRow(index)}
							companyId={data.sklad.company}
							requireCatalogMatch
							onCatalogMatchChange={handleCatalogMatchChange}
							showCount
						/>
					))}

					<div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4'>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-red'>
								O'zgargan mahsulotlar bo'yicha izoh kiriting <span className='text-ca-red'>*</span>
							</label>
							<Input value={comment} onChange={(e) => setComment(e.target.value)} />
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>Avtomobil raqami</label>
							<Input value={carNumber} onChange={(e) => setCarNumber(e.target.value)} />
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-green'>Berilgan Summa ($)</label>
							<PriceInput value={givenSumDollar} onChange={setGivenSumDollar} />
						</div>
						<div>
							<label className='mb-1 block text-xs font-semibold text-ca-orange'>Jami chegirma ($)</label>
							<PriceInput value={discountAmount} onChange={setDiscountAmount} />
						</div>
					</div>

					<Button type='submit' variant='theme' className='mt-4 h-11 w-full text-sm' loading={isSaving}>
						O'zgartirish
					</Button>
				</form>
			</Panel>
		</>
	);
}

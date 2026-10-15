import { useEffect, useMemo } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { Button, Combobox, PriceInput } from '@/components/ui';
import { formatNumber } from '@/lib/number';
import { generateId } from '@/lib/utils';
import { useVozvratProductsQuery } from '@/services/vozvrat/vozvrat.queries';
import type { VozvratProductItem } from '@/services/vozvrat/vozvrat.types';

export interface VozvratRowValue {
	key: number | string;
	/** The sklad (type_sklad) the product goes back to. */
	locationKey: string;
	/** "brand-category-size-type" of the picked product. */
	variantKey: string;
	count: number | null;
	price: string;
}

export const emptyVozvratRow = (): VozvratRowValue => ({
	key: generateId(),
	locationKey: '',
	variantKey: '',
	count: null,
	price: '',
});

const variantKeyOf = (item: Pick<VozvratProductItem, 'brand' | 'product_category' | 'size' | 'type'>) =>
	`${item.brand}-${item.product_category}-${item.size}-${item.type}`;

/** "Model | Nomi | O'lcham | Tip" of a returnable product. */
function productLabel(item: VozvratProductItem): string {
	return [item.brand_name, item.product_category_name, formatNumber(item.size), item.type_name]
		.filter(Boolean)
		.join(' | ');
}

interface VozvratProductRowProps {
	value: VozvratRowValue;
	onChange: (value: VozvratRowValue) => void;
	error?: string;
	showAdd?: boolean;
	onAdd?: () => void;
	showRemove?: boolean;
	onRemove?: () => void;
	clientId: number;
	onResolve?: (key: string | number, row: VozvratProductItem | undefined) => void;
	/**
	 * The order's own current product data for this row. The "available to return" list only
	 * contains stock the client hasn't returned yet, so a product this same order already fully
	 * returned won't appear there — this fills the gap so the row still shows its own product/sklad.
	 */
	fallback?: VozvratProductItem;
}

export default function VozvratProductRow({
	value,
	onChange,
	error,
	showAdd,
	onAdd,
	showRemove,
	onRemove,
	clientId,
	onResolve,
	fallback,
}: VozvratProductRowProps) {
	const { data: productsData } = useVozvratProductsQuery({ client_id: clientId });

	// Everything the client can still return, plus this row's own product when the list lacks it.
	const items = useMemo(() => {
		const live = (productsData?.groups ?? []).flatMap((g) => g.items);
		if (
			fallback &&
			!live.some((i) => i.type_sklad === fallback.type_sklad && variantKeyOf(i) === variantKeyOf(fallback))
		) {
			return [...live, fallback];
		}
		return live;
	}, [productsData, fallback]);

	const locationOptions = useMemo(() => {
		const byId = new Map<number, string>();
		for (const item of items) if (!byId.has(item.type_sklad)) byId.set(item.type_sklad, item.type_sklad_name);
		return Array.from(byId, ([id, name]) => ({ value: String(id), label: name }));
	}, [items]);

	const productOptions = useMemo(
		() =>
			items
				.filter((item) => String(item.type_sklad) === value.locationKey)
				.map((item) => ({
					value: variantKeyOf(item),
					label: `${productLabel(item)} (${formatNumber(item.remaining_count)})`,
					item,
				})),
		[items, value.locationKey],
	);

	const selectedRow = productOptions.find((o) => o.value === value.variantKey)?.item;

	useEffect(() => {
		onResolve?.(value.key, selectedRow);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedRow, value.key]);

	function handleLocationChange(locationKey: string) {
		onChange({ ...value, locationKey, variantKey: '' });
	}

	function handleProductChange(variantKey: string) {
		const row = productOptions.find((o) => o.value === variantKey)?.item;
		onChange({ ...value, variantKey, price: row ? String(row.price_dollar) : value.price });
	}

	return (
		<div className='mb-3'>
			<div className='flex flex-wrap items-start gap-3'>
				<div className='min-w-37.5 flex-1'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>
						Sklad <span className='text-ca-red'>*</span>
					</label>
					<Combobox
						value={value.locationKey}
						onChange={handleLocationChange}
						options={locationOptions}
						placeholder='Tanlang...'
						searchPlaceholder='Qidirish...'
					/>
				</div>
				<div className='min-w-75 flex-[3]'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>
						Mahsulot <span className='text-ca-red'>*</span>
					</label>
					<Combobox
						key={value.locationKey}
						value={value.variantKey}
						onChange={handleProductChange}
						options={productOptions.map((o) => ({ value: o.value, label: o.label }))}
						selectedLabel={selectedRow ? productLabel(selectedRow) : undefined}
						placeholder='Tanlang...'
						searchPlaceholder='Mahsulot qidirish...'
						disabled={!value.locationKey}
					/>
				</div>
				<div className='min-w-25 flex-1'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>
						Soni <span className='text-ca-red'>*</span>
					</label>
					<PriceInput
						value={value.count ?? ''}
						onChange={(count) => onChange({ ...value, count: count ? Number(count) : null })}
					/>
				</div>
				<div className='min-w-37.5 flex-1'>
					<label className='mb-1 block text-xs font-semibold text-ca-heading'>
						Narxi ($) <span className='text-ca-red'>*</span>
					</label>
					<PriceInput value={value.price} onChange={(price) => onChange({ ...value, price })} />
					{error && <p className='mt-1 text-[13px] text-ca-red'>{error}</p>}
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
						<Button type='button' variant='success' size='icon' aria-label="Qator qo'shish" onClick={onAdd}>
							<FaPlus />
						</Button>
					)}
				</div>
			</div>
			{value.variantKey &&
				(selectedRow ? (
					<p className='mt-1 text-[13px] text-ca-text'>
						Qoldiq:{' '}
						<span className='font-semibold text-ca-heading'>
							{formatNumber(selectedRow.remaining_count)} ta
						</span>
					</p>
				) : productsData ? (
					<p className='mt-1 text-[13px] font-semibold text-ca-red'>Bu tovar mijozda topilmadi</p>
				) : null)}
		</div>
	);
}

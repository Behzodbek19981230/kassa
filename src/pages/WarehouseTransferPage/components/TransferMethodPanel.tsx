import { useEffect, useMemo, useState } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import {
	Button,
	Combobox,
	FormField,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	RadioGroup,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useProductCardNames } from '@/lib/useProductCardNames';
import {
	useSkladProductByPairQuery,
	useSkladProductListQuery,
} from '@/services/sklad-product/sklad-product.queries';
import type { SkladProduct } from '@/services/sklad-product/sklad-product.types';
import { useValidateTransferItemMutation } from '@/services/warehouse-transfer/warehouse-transfer.queries';
import type { TransferMode } from '@/services/warehouse-transfer/warehouse-transfer.types';
import type { TransferCartRow } from '@/pages/WarehouseTransferPage/types';

interface TransferMethodPanelProps {
	/** The product's stock row in the source sklad. */
	sourceItem: SkladProduct;
	fromTypeSkladId: number;
	fromTypeSkladName?: string;
	toTypeSkladId: number;
	toTypeSkladName?: string;
	availableCount: number;
	onAdd: (row: TransferCartRow) => void;
	onCancel: () => void;
}

export default function TransferMethodPanel({
	sourceItem,
	fromTypeSkladId,
	fromTypeSkladName,
	toTypeSkladId,
	toTypeSkladName,
	availableCount,
	onAdd,
	onCancel,
}: TransferMethodPanelProps) {
	const [mode, setMode] = useState<TransferMode>('same');
	const [sourceQuantity, setSourceQuantity] = useState('');
	const [targetQuantity, setTargetQuantity] = useState('');
	const [spreadTargetKey, setSpreadTargetKey] = useState('');
	const [error, setError] = useState('');

	// Reset the form whenever a different source row is picked, so leftover
	// input from a previous selection can't leak into the next validation.
	useEffect(() => {
		setMode('same');
		setSourceQuantity('');
		setTargetQuantity('');
		setSpreadTargetKey('');
		setError('');
	}, [sourceItem.id]);

	const names = useProductCardNames();
	const sourceCard = sourceItem.warehouse_detail;
	const stockLabel = (stock: SkladProduct) =>
		`${names.brandName(stock.warehouse_detail)} / ${names.categoryName(stock.warehouse_detail)} / ${formatNumber(
			stock.warehouse_detail?.size ?? 0,
		)} / ${names.typeName(stock.warehouse_detail)} / ${stock.type_sklad_detail?.name ?? toTypeSkladName ?? ''}`;

	// "Same": the same product card, in the target sklad.
	const sameModeQuery = useSkladProductByPairQuery(mode === 'same' ? sourceItem.warehouse : undefined, toTypeSkladId);
	const sameTarget = sameModeQuery.data ?? null;

	// "Spread": any product of the same model and nomi in the target sklad. The stock list can't filter by
	// model or nomi, so it is narrowed down here.
	const spreadModeQuery = useSkladProductListQuery({ type_sklad: toTypeSkladId, limit: 1000 }, mode === 'spread');
	const spreadOptions = useMemo(() => {
		const results = (spreadModeQuery.data?.results ?? []).filter(
			(stock) =>
				stock.warehouse_detail?.brand === sourceCard?.brand &&
				stock.warehouse_detail?.product_category === sourceCard?.product_category,
		);
		return results.map((stock) => ({ value: String(stock.id), label: stockLabel(stock), row: stock }));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [spreadModeQuery.data, sourceCard?.brand, sourceCard?.product_category]);

	const spreadTarget = spreadOptions.find((o) => o.value === spreadTargetKey)?.row ?? null;

	const validateMutation = useValidateTransferItemMutation();

	function handleModeChange(value: string) {
		setMode(value as TransferMode);
		setSourceQuantity('');
		setTargetQuantity('');
		setSpreadTargetKey('');
		setError('');
	}

	function handleSubmit() {
		setError('');

		const sourceQty = Number(sourceQuantity);
		if (!sourceQty || sourceQty <= 0) {
			setError("O'tkazish miqdorini kiriting");
			return;
		}
		if (sourceQty > availableCount) {
			setError(`Miqdor yetarli emas. Mavjud: ${formatNumber(availableCount)}`);
			return;
		}

		const target = mode === 'same' ? sameTarget : spreadTarget;
		if (!target) {
			setError("Bu skladda bu tovar mavjud emas.Tavar va narxlarga o'tib qo'shib qoyishingiz mumkin");
			return;
		}

		const targetQty = mode === 'same' ? sourceQty : Number(targetQuantity);
		if (!targetQty || targetQty <= 0) {
			setError('Qabul qilish sonini kiriting');
			return;
		}

		validateMutation.mutate(
			{
				from_type_sklad_id: fromTypeSkladId,
				to_type_sklad_id: toTypeSkladId,
				source_sklad_product_id: sourceItem.id,
				target_sklad_product_id: target.id,
				mode,
				source_quantity: sourceQty,
				target_quantity: targetQty,
			},
			{
				onSuccess: () => {
					onAdd({
						key: `${sourceItem.id}-${target.id}-${mode}-${Date.now()}`,
						mode,
						source: {
							skladProductId: sourceItem.id,
							typeSkladName: fromTypeSkladName ?? sourceItem.type_sklad_detail?.name ?? '',
							brandName: names.brandName(sourceCard),
							categoryName: names.categoryName(sourceCard),
							size: Number(sourceCard?.size ?? 0),
							typeName: names.typeName(sourceCard),
							quantity: sourceQty,
						},
						target: {
							skladProductId: target.id,
							typeSkladName: toTypeSkladName ?? target.type_sklad_detail?.name ?? '',
							brandName: names.brandName(target.warehouse_detail),
							categoryName: names.categoryName(target.warehouse_detail),
							size: Number(target.warehouse_detail?.size ?? 0),
							typeName: names.typeName(target.warehouse_detail),
							quantity: targetQty,
						},
					});
				},
				onError: (err) => setError(getApiErrorMessage(err, 'Tekshirishda xatolik yuz berdi')),
			},
		);
	}

	const noSameTarget = mode === 'same' && !sameModeQuery.isLoading && !sameModeQuery.isFetching && !sameTarget;
	const noSpreadOptions =
		mode === 'spread' && !spreadModeQuery.isLoading && !spreadModeQuery.isFetching && spreadOptions.length === 0;

	return (
		<Modal open onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Transfer usuli</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<div className='mb-4 rounded-[3px] bg-ca-silver p-3 text-xs'>
						<div className='flex items-center justify-between'>
							<span className='font-semibold text-ca-heading'>Tovar:</span>
							<span className='truncate font-bold text-ca-red'>
								{names.brandName(sourceCard)} / {names.categoryName(sourceCard)} /{' '}
								{formatNumber(sourceCard?.size ?? 0)} / {names.typeName(sourceCard)}
							</span>
						</div>
						<div className='mt-1 flex items-center justify-between'>
							<span className='font-semibold text-ca-heading'>Bor miqdor:</span>
							<span className='font-bold text-ca-heading'>
								{formatNumber(availableCount)} {names.typeName(sourceCard)}
							</span>
						</div>
					</div>

					<FormField label='Transfer usuli' horizontal={false} className='mb-3'>
						<RadioGroup
							name='transfer-mode'
							value={mode}
							onChange={handleModeChange}
							options={[
								{ value: 'same', label: "O'z holicha o'tkazish" },
								{ value: 'spread', label: "Yoyib o'tkazish" },
							]}
							inline
						/>
					</FormField>

					{mode === 'spread' && (
						<FormField label='Qabul qilinadigan tovarni tanlash' horizontal={false} className='mb-3'>
							<Combobox
								value={spreadTargetKey}
								onChange={setSpreadTargetKey}
								options={spreadOptions.map(({ value, label }) => ({ value, label }))}
								placeholder="Tovar nomi, brand, hajm yoki shakli bo'yicha qidirish..."
								clearable
							/>
							{noSpreadOptions && (
								<p className='mt-1 text-[13px] text-ca-red'>
									Bu skladda bu tovar mavjud emas.Tavar va narxlarga o'tib qo'shib qoyishingiz mumkin
								</p>
							)}
						</FormField>
					)}

					{noSameTarget && (
						<p className='mb-3 text-[13px] text-ca-red'>
							Bu skladda bu tovar mavjud emas.Tavar va narxlarga o'tib qo'shib qoyishingiz mumkin
						</p>
					)}

					<div className={mode === 'spread' ? 'grid grid-cols-2 gap-3' : ''}>
						<FormField label="O'tkazish miqdori" horizontal={false} className='mb-3'>
							<div className='flex gap-2'>
								<Input
									type='number'
									inputMode='numeric'
									min={0}
									max={availableCount}
									step='1'
									value={sourceQuantity}
									onChange={(e) => setSourceQuantity(e.target.value)}
									className='flex-1'
								/>
								<Input
									type='text'
									value={names.typeName(sourceCard)}
									disabled
									className='w-20 text-center'
								/>
							</div>
						</FormField>
						{mode === 'spread' && (
							<FormField label='Qabul qilish soni' horizontal={false} className='mb-3'>
								<div className='flex gap-2'>
									<Input
										type='number'
										inputMode='numeric'
										min={0}
										step='1'
										value={targetQuantity}
										onChange={(e) => setTargetQuantity(e.target.value)}
										className='flex-1'
									/>
									<Input
										type='text'
										value={names.typeName(spreadTarget?.warehouse_detail)}
										disabled
										className='w-20 text-center'
									/>
								</div>
							</FormField>
						)}
					</div>

					{error && (
						<div className='rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
							{error}
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button type='button' variant='white' onClick={onCancel}>
						Bekor qilish
					</Button>
					<Button
						type='button'
						variant='warning'
						loading={validateMutation.isPending}
						onClick={handleSubmit}
					>
						<FaShoppingCart className='mr-1.5' />{' '}
						{validateMutation.isPending ? 'Tekshirilmoqda...' : 'Karzinkaga qoshish'}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

import { useEffect, useState } from 'react';
import { FaArrowLeft, FaListUl } from 'react-icons/fa';
import {
	Badge,
	Button,
	FormField,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	PriceInput,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useExchangeRateHistoryListQuery } from '@/services/exchange-rate-history/exchange-rate-history.queries';
import type { ExchangeRateHistoryUserDetail } from '@/services/exchange-rate-history/exchange-rate-history.types';
import { useSaveExchangeRateMutation } from '@/services/exchange-rate/exchange-rate.queries';
import { useYuanExchangeRateHistoryListQuery } from '@/services/yuan-exchange-rate-history/yuan-exchange-rate-history.queries';
import { useSaveYuanExchangeRateMutation } from '@/services/yuan-exchange-rate/yuan-exchange-rate.queries';

export type ExchangeRateCurrency = 'dollar' | 'yuan';

// The dollar rate is entered in so'm; the yuan rate is entered as how many yuan 1 dollar is worth.
const CURRENCY_TEXT: Record<ExchangeRateCurrency, { name: string; label: string; unit: string; decimals: number }> = {
	dollar: { name: 'Dollar', label: 'dollar', unit: "so'm", decimals: 2 },
	yuan: { name: 'Yuan', label: 'yuan', unit: '¥', decimals: 2 },
};

interface ExchangeRateEditModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	companyId: number;
	currency: ExchangeRateCurrency;
	/** Current rate record for `currency`, or null if none exists yet (save will create one). */
	rateId?: number;
	rateValue?: string | number;
}

function formatDateTime(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	const date = d.toLocaleDateString('ru-RU');
	const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	return `${date} ${time}`;
}

function userLabel(u: ExchangeRateHistoryUserDetail | null) {
	if (!u) return '-';
	return `${u.last_name} ${u.first_name}`.trim() || u.username;
}

export default function ExchangeRateEditModal({
	open,
	setOpen,
	companyId,
	currency,
	rateId,
	rateValue,
}: ExchangeRateEditModalProps) {
	const { notify } = useNotification();
	const text = CURRENCY_TEXT[currency];
	const saveDollarMutation = useSaveExchangeRateMutation();
	const saveYuanMutation = useSaveYuanExchangeRateMutation();
	const isSaving = saveDollarMutation.isPending || saveYuanMutation.isPending;
	const [rate, setRate] = useState(() => String(rateValue ?? ''));
	const [error, setError] = useState('');
	const [view, setView] = useState<'edit' | 'history'>('edit');

	// exchangeRate can still be loading (or resolve to a newer value) by the time this
	// modal is opened, since it's mounted once in Header and just toggled visible/hidden —
	// keep the field in sync with it for as long as the dialog is open.
	useEffect(() => {
		if (open) setRate(String(rateValue ?? ''));
	}, [open, rateValue]);

	const historyEnabled = open && view === 'history';
	const dollarHistory = useExchangeRateHistoryListQuery(
		{ company: companyId, limit: 50 },
		historyEnabled && currency === 'dollar',
	);
	const yuanHistory = useYuanExchangeRateHistoryListQuery(
		{ company: companyId, limit: 50 },
		historyEnabled && currency === 'yuan',
	);
	const isHistoryLoading = currency === 'dollar' ? dollarHistory.isLoading : yuanHistory.isLoading;
	const historyItems =
		currency === 'dollar'
			? (dollarHistory.data?.results ?? []).map((item) => ({
					id: item.id,
					created_time: item.created_time,
					user: item.created_by_detail ?? item.user_detail,
					action: item.action,
					old_value: item.old_dollar,
					new_value: item.new_dollar,
				}))
			: // The yuan history has no `action` field: the initial record is the one without an old value.
				(yuanHistory.data?.results ?? []).map((item) => ({
					id: item.id,
					created_time: item.created_time,
					user: item.created_by_detail,
					action: item.old_value == null ? ('CREATE' as const) : ('UPDATE' as const),
					// Decimal strings like "0.16000000" — Number() drops the trailing zeros.
					old_value: item.old_value == null ? null : Number(item.old_value),
					new_value: item.new_value == null ? null : Number(item.new_value),
				}));

	const resetAndClose = (next: boolean) => {
		if (!next) setView('edit');
		setOpen(next);
	};

	const handleSubmit = async () => {
		if (!rate) {
			setError(`${text.name} kursini kiriting`);
			return;
		}
		setError('');
		try {
			if (currency === 'dollar') {
				await saveDollarMutation.mutateAsync({
					id: rateId,
					payload: { dollar: rate, status: true, company: companyId },
				});
			} else {
				await saveYuanMutation.mutateAsync({
					id: rateId,
					payload: { dollar_per_yuan: rate, status: true, company: companyId },
				});
			}
			notify({ title: `${text.name} kursi yangilandi` });
			resetAndClose(false);
		} catch (err) {
			setError(getApiErrorMessage(err, 'Kursni saqlashda xatolik yuz berdi'));
		}
	};

	return (
		<Modal open={open} onOpenChange={resetAndClose}>
			<ModalContent className={view === 'history' ? 'max-w-2xl' : undefined}>
				<ModalHeader className='flex items-center justify-between'>
					<ModalTitle>
						{view === 'edit' ? `Kunlik ${text.label} kursini o'zgartirish` : `${text.name} kursi tarixi`}
					</ModalTitle>
					{view === 'edit' ? (
						<Tooltip content="Kurs o'zgarishlari tarixini ko'rish">
							<button
								type='button'
								aria-label='Kurs tarixi'
								onClick={() => setView('history')}
								className='mr-2 flex items-center gap-1.5 rounded-full border border-ca-theme/30 bg-ca-theme/10 px-3 py-1.5 text-xs font-semibold text-ca-theme transition-colors hover:bg-ca-theme hover:text-white focus:outline-none'
							>
								<FaListUl />
								Tarix
							</button>
						</Tooltip>
					) : (
						<button
							type='button'
							aria-label='Orqaga'
							onClick={() => setView('edit')}
							className='mr-2 flex items-center gap-1.5 rounded-full border border-ca-border px-3 py-1.5 text-xs font-semibold text-ca-heading transition-colors hover:bg-ca-silver focus:outline-none'
						>
							<FaArrowLeft /> Orqaga
						</button>
					)}
				</ModalHeader>

				{view === 'edit' ? (
					<>
						<ModalBody>
							<FormField label={currency === 'yuan' ? '1 dollar necha yuan (¥)' : `${text.name} kursi (${text.unit})`} horizontal={false} error={error} required>
								<PriceInput value={rate} onChange={setRate} decimals={text.decimals} autoFocus />
							</FormField>
						</ModalBody>
						<ModalFooter>
							<Button variant='white' onClick={() => resetAndClose(false)}>
								Bekor qilish
							</Button>
							<Button variant='success' onClick={handleSubmit} loading={isSaving}>
								Saqlash
							</Button>
						</ModalFooter>
					</>
				) : (
					<ModalBody className='max-h-[70vh] overflow-y-auto'>
						{isHistoryLoading && <p className='text-center'>Yuklanmoqda...</p>}
						{!isHistoryLoading && historyItems.length === 0 && (
							<p className='text-center'>Tarix mavjud emas</p>
						)}
						{!isHistoryLoading && historyItems.length > 0 && (
							<div className='overflow-x-auto'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='bg-ca-theme text-white'>Sana</TableHead>
											<TableHead className='bg-ca-theme text-white'>Kim</TableHead>
											<TableHead className='bg-ca-theme text-white'>Amal</TableHead>
											<TableHead className='bg-ca-theme text-white'>Eski qiymat</TableHead>
											<TableHead className='bg-ca-theme text-white'>Yangi qiymat</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{historyItems.map((item) => (
											<TableRow key={item.id}>
												<TableCell>{formatDateTime(item.created_time)}</TableCell>
												<TableCell>
													{userLabel(item.user)}
												</TableCell>
												<TableCell>
													<Badge variant={item.action === 'CREATE' ? 'info' : 'warning'}>
														{item.action === 'CREATE' ? 'Yaratildi' : 'Yangilandi'}
													</Badge>
												</TableCell>
												<TableCell>
													{item.old_value == null
														? '-'
														: `${formatNumber(item.old_value)} ${text.unit}`}
												</TableCell>
												<TableCell className='font-semibold'>
													{item.new_value == null
														? '-'
														: `${formatNumber(item.new_value)} ${text.unit}`}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</ModalBody>
				)}
			</ModalContent>
		</Modal>
	);
}

import { useState } from 'react';
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
import type { ExchangeRateItem } from '@/services/exchange-rate/exchange-rate.types';

interface ExchangeRateEditModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	companyId: number;
	exchangeRate: ExchangeRateItem | null;
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

export default function ExchangeRateEditModal({ open, setOpen, companyId, exchangeRate }: ExchangeRateEditModalProps) {
	const { notify } = useNotification();
	const saveMutation = useSaveExchangeRateMutation();
	const [dollar, setDollar] = useState(() => String(exchangeRate?.dollar ?? ''));
	const [error, setError] = useState('');
	const [view, setView] = useState<'edit' | 'history'>('edit');

	const { data: historyData, isLoading: isHistoryLoading } = useExchangeRateHistoryListQuery(
		{ company: companyId, limit: 50 },
		open && view === 'history',
	);
	const historyItems = historyData?.results ?? [];

	const resetAndClose = (next: boolean) => {
		if (!next) {
			setDollar(String(exchangeRate?.dollar ?? ''));
			setView('edit');
		}
		setOpen(next);
	};

	const handleSubmit = async () => {
		if (!dollar) {
			setError('Dollar kursini kiriting');
			return;
		}
		setError('');
		try {
			await saveMutation.mutateAsync({
				id: exchangeRate?.id,
				payload: { dollar, status: true, company: companyId },
			});
			notify({ title: 'Dollar kursi yangilandi' });
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
						{view === 'edit' ? "Kunlik dollar kursini o'zgartirish" : 'Dollar kursi tarixi'}
					</ModalTitle>
					{view === 'edit' ? (
						<Tooltip content='Kurs tarixi'>
							<button
								type='button'
								aria-label='Kurs tarixi'
								onClick={() => setView('history')}
								className='mr-2 text-ca-theme focus:outline-none'
							>
								<FaListUl />
							</button>
						</Tooltip>
					) : (
						<button
							type='button'
							aria-label='Orqaga'
							onClick={() => setView('edit')}
							className='mr-2 flex items-center gap-1.5 text-xs text-ca-theme focus:outline-none'
						>
							<FaArrowLeft /> Orqaga
						</button>
					)}
				</ModalHeader>

				{view === 'edit' ? (
					<>
						<ModalBody>
							<FormField label="Dollar kursi (so'm)" horizontal={false} error={error} required>
								<PriceInput value={dollar} onChange={setDollar} autoFocus />
							</FormField>
						</ModalBody>
						<ModalFooter>
							<Button variant='white' onClick={() => resetAndClose(false)}>
								Bekor qilish
							</Button>
							<Button variant='success' onClick={handleSubmit} disabled={saveMutation.isPending}>
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
													{userLabel(item.created_by_detail ?? item.user_detail)}
												</TableCell>
												<TableCell>
													<Badge variant={item.action === 'CREATE' ? 'info' : 'warning'}>
														{item.action === 'CREATE' ? 'Yaratildi' : 'Yangilandi'}
													</Badge>
												</TableCell>
												<TableCell>
													{item.old_dollar == null
														? '-'
														: `${formatNumber(item.old_dollar)} so'm`}
												</TableCell>
												<TableCell className='font-semibold'>
													{item.new_dollar == null
														? '-'
														: `${formatNumber(item.new_dollar)} so'm`}
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

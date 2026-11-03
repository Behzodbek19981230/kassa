import { isAxiosError } from 'axios';
import { type ReactNode, useEffect } from 'react';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Panel, Skeleton, useNotification } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import {
	DEBT_DELETE_HISTORY_PATH,
	formatMoney,
	PAID_KEYS,
	pickField,
	pickText,
} from '@/pages/DebtRepaymentDeleteHistoryPage/utils';
import { formatTashkentDate, formatTashkentDateTime } from '@/pages/TwoStageImport/utils';
import { useDebtRepaymentDeleteHistoryQuery } from '@/services/debt-repayment-delete-history/debt-repayment-delete-history.queries';

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className='flex gap-3 py-1'>
			<span className='w-44 shrink-0 font-semibold text-ca-heading'>{label}:</span>
			<span className='min-w-0 wrap-break-word text-ca-heading'>{children}</span>
		</div>
	);
}

/** Read-only snapshot of one deleted debt repayment (`/debt-repayment-delete-history/{id}/`). */
export default function DebtRepaymentDeleteHistoryDetailPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const { id } = useParams();
	const auditId = Number(id) || undefined;
	const { notify } = useNotification();
	const { data, isLoading, isError, error } = useDebtRepaymentDeleteHistoryQuery(auditId);
	const isNotFound = isAxiosError(error) && error.response?.status === 404;

	// A stale link can 404 — drop back to the list.
	useEffect(() => {
		if (!isNotFound) return;
		notify({ title: 'Bu tarix topilmadi yoki saqlash muddati tugagan.' });
		navigate(DEBT_DELETE_HISTORY_PATH, { replace: true });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isNotFound]);

	const row = data as Record<string, unknown> | undefined;
	const money = (...keys: string[]) => formatMoney(pickField(row, ...keys));
	const totalDebt = Number(pickField(row, 'total_debt')) || 0;
	const rate = pickField(row, 'exchange_rate');

	return (
		<Panel
			title={
				<span className='flex items-center gap-2'>
					O'chirilgan qarz to'lovi tafsilotlari <Badge variant='default'>Faqat ko'rish</Badge>
				</span>
			}
			actions={
				<Button
					type='button'
					variant='info'
					size='xs'
					// Going back keeps the list's page; a directly opened link has no history to return to.
					onClick={() => (location.key === 'default' ? navigate(DEBT_DELETE_HISTORY_PATH) : navigate(-1))}
				>
					<FaArrowLeft className='mr-1.5' /> Orqaga qaytish
				</Button>
			}
		>
			{isLoading ? (
				<div className='grid gap-4 rounded-[3px] border border-ca-border p-4 md:grid-cols-2'>
					{Array.from({ length: 2 }).map((_, col) => (
						<div key={col} className='space-y-2'>
							{Array.from({ length: 7 }).map((_, r) => (
								<Skeleton key={r} className='h-4 w-full' />
							))}
						</div>
					))}
				</div>
			) : isError || !row ? (
				!isNotFound && (
					<div className='flex items-center justify-center gap-2 p-5 text-xs text-ca-red'>
						<FaExclamationTriangle /> {getApiErrorMessage(error, 'Xatolik yuz berdi')}
					</div>
				)
			) : (
				<div className='grid rounded-[3px] border border-ca-border text-xs md:grid-cols-2'>
					<div className='p-4 md:border-r md:border-ca-border'>
						<InfoRow label='Mijoz'>{pickText(row, 'client_name', 'client_fio', 'client_detail') || '-'}</InfoRow>
						<InfoRow label='Telefon'>{pickText(row, 'client_phone') || '-'}</InfoRow>
						<InfoRow label="To'lov sanasi">
							{formatTashkentDate(pickText(row, 'repayment_date', 'date', 'cr_date_time') || null)}
						</InfoRow>
						<InfoRow label='Kim yaratgan'>
							{pickText(row, 'original_created_by_name', 'created_by_name', 'created_by_detail') || '-'}
						</InfoRow>
						<InfoRow label="Kim o'chirgan">{pickText(row, 'deleted_by_name', 'deleted_by_detail') || '-'}</InfoRow>
						<InfoRow label="O'chirilgan vaqt">
							{formatTashkentDateTime(pickText(row, 'deleted_at', 'deleted_time', 'created_time') || null)}
						</InfoRow>
						<InfoRow label='Izoh'>{pickText(row, 'text', 'note', 'comment') || '-'}</InfoRow>
					</div>
					<div className='border-t border-ca-border p-4 md:border-t-0'>
						<InfoRow label="To'langan summa ($)">{money(...PAID_KEYS)}</InfoRow>
						<InfoRow label='Dollar ($)'>{money('summ_dollar')}</InfoRow>
						<InfoRow label="Naqd so'm">{formatNumber(Number(pickField(row, 'sum_som')) || 0)}</InfoRow>
						<InfoRow label='Karta'>{formatNumber(Number(pickField(row, 'summ_cart')) || 0)}</InfoRow>
						<InfoRow label="O'tkazma">{formatNumber(Number(pickField(row, 'sum_transfers')) || 0)}</InfoRow>
						<InfoRow label='Kurs'>{rate != null ? formatNumber(Number(rate) || 0) : '-'}</InfoRow>
						<InfoRow label='Chegirma ($)'>{money('discount_amount')}</InfoRow>
						<InfoRow label='Eski qarz ($)'>{money('total_debt_old')}</InfoRow>
						<InfoRow label='Qolgan qarz ($)'>
							<span className={totalDebt > 0 ? 'font-semibold text-ca-red' : 'font-semibold text-ca-green'}>
								{formatNumber(totalDebt, 2)}
							</span>
						</InfoRow>
					</div>
				</div>
			)}
		</Panel>
	);
}

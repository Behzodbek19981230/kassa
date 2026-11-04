import { isAxiosError } from 'axios';
import type { ReactNode } from 'react';
import {
	FaCalendarAlt,
	FaClock,
	FaCommentAlt,
	FaExclamationTriangle,
	FaPhoneAlt,
	FaTrashAlt,
	FaUser,
	FaUserEdit,
	FaUserTimes,
} from 'react-icons/fa';
import {
	Badge,
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	Skeleton,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { cn } from '@/lib/utils';
import { formatMoney, PAID_KEYS, pickField, pickText } from '@/pages/DebtRepaymentDeleteHistoryPage/utils';
import { formatTashkentDate, formatTashkentDateTime } from '@/pages/TwoStageImport/utils';
import { useDebtRepaymentDeleteHistoryQuery } from '@/services/debt-repayment-delete-history/debt-repayment-delete-history.queries';
import type { DebtRepaymentDeleteHistoryRow } from '@/services/debt-repayment-delete-history/debt-repayment-delete-history.types';

interface DebtRepaymentDeleteHistoryModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	/** The list row that was clicked: shown right away while the full snapshot loads. */
	row: DebtRepaymentDeleteHistoryRow | null;
}

const TONE_CLASSES = {
	neutral: 'border-ca-border bg-ca-silver text-ca-heading',
	theme: 'border-ca-theme/30 bg-ca-theme/5 text-ca-theme',
	danger: 'border-ca-danger-border bg-ca-danger-bg text-ca-red',
	success: 'border-ca-green/30 bg-ca-green/5 text-ca-green',
} as const;

function SummaryTile({ label, value, tone }: { label: string; value: ReactNode; tone: keyof typeof TONE_CLASSES }) {
	return (
		<div className={cn('rounded-[3px] border px-3 py-2.5 text-center', TONE_CLASSES[tone])}>
			<div className='text-[11px] font-medium text-ca-text'>{label}</div>
			<div className='mt-0.5 text-base font-bold'>{value}</div>
		</div>
	);
}

function SectionTitle({ children }: { children: ReactNode }) {
	return <div className='mb-2 text-[11px] font-semibold tracking-wide text-ca-text uppercase'>{children}</div>;
}

function AmountItem({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className='flex items-center justify-between gap-2 rounded-[3px] bg-ca-silver px-3 py-2'>
			<span className='text-ca-text'>{label}</span>
			<span className='font-semibold text-ca-heading'>{value}</span>
		</div>
	);
}

function AuditItem({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
	return (
		<div className='flex items-start gap-2.5'>
			<span className='mt-0.5 text-ca-text'>{icon}</span>
			<div className='min-w-0'>
				<div className='text-[11px] text-ca-text'>{label}</div>
				<div className='wrap-break-word font-semibold text-ca-heading'>{value}</div>
			</div>
		</div>
	);
}

function LoadingState() {
	return (
		<div className='space-y-4'>
			<Skeleton className='h-14 w-full' />
			<div className='grid grid-cols-3 gap-2'>
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className='h-14 w-full' />
				))}
			</div>
			<div className='grid gap-2 sm:grid-cols-2'>
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className='h-8 w-full' />
				))}
			</div>
		</div>
	);
}

/** Read-only snapshot of one deleted debt repayment (`/debt-repayment-delete-history/{id}/`), opened from the list. */
export default function DebtRepaymentDeleteHistoryModal({ open, setOpen, row: listRow }: DebtRepaymentDeleteHistoryModalProps) {
	const { data, isLoading, isError, error } = useDebtRepaymentDeleteHistoryQuery(open ? listRow?.id : undefined);
	const isNotFound = isAxiosError(error) && error.response?.status === 404;

	const row = (data ?? listRow ?? undefined) as Record<string, unknown> | undefined;
	const money = (...keys: string[]) => formatMoney(pickField(row, ...keys));
	const sum = (key: string) => formatNumber(Number(pickField(row, key)) || 0);
	const totalDebt = Number(pickField(row, 'total_debt')) || 0;
	const rate = pickField(row, 'exchange_rate');
	const phone = pickText(row, 'client_phone');
	const note = pickText(row, 'text', 'note', 'comment');

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-2xl'>
				<ModalHeader>
					<ModalTitle className='flex items-center gap-2'>
						<FaTrashAlt className='text-ca-red' />
						O'chirilgan qarz to'lovi
						{listRow?.id != null && <span className='text-ca-text'>#{listRow.id}</span>}
						<Badge variant='default'>Faqat ko'rish</Badge>
					</ModalTitle>
				</ModalHeader>

				<ModalBody>
					{isError ? (
						<div className='flex items-center justify-center gap-2 rounded-[3px] border border-ca-danger-border bg-ca-danger-bg p-5 text-ca-red'>
							<FaExclamationTriangle />
							{isNotFound
								? 'Bu tarix topilmadi yoki saqlash muddati tugagan.'
								: getApiErrorMessage(error, 'Xatolik yuz berdi')}
						</div>
					) : !row ? (
						isLoading && <LoadingState />
					) : (
						<div className='space-y-4'>
							{/* Client */}
							<div className='flex flex-wrap items-center gap-3 rounded-[3px] border border-ca-border bg-ca-silver p-3'>
								<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ca-theme/10 text-ca-theme'>
									<FaUser />
								</div>
								<div className='min-w-0 flex-1'>
									<div className='truncate text-sm font-semibold text-ca-heading'>
										{pickText(row, 'client_name', 'client_fio', 'client_detail') || '-'}
									</div>
									{phone && (
										<div className='mt-0.5 flex items-center gap-1.5 text-[11px] text-ca-text'>
											<FaPhoneAlt className='text-[10px]' /> {phone}
										</div>
									)}
								</div>
								<div className='text-right'>
									<div className='text-[11px] text-ca-text'>To'lov sanasi</div>
									<div className='flex items-center justify-end gap-1.5 font-semibold text-ca-theme'>
										<FaCalendarAlt className='text-[11px]' />
										{formatTashkentDate(pickText(row, 'repayment_date', 'date', 'cr_date_time') || null)}
									</div>
								</div>
							</div>

							{/* Debt summary */}
							<div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
								<SummaryTile label='Eski qarz ($)' value={money('total_debt_old')} tone='neutral' />
								<SummaryTile label="To'langan ($)" value={money(...PAID_KEYS)} tone='theme' />
								<SummaryTile
									label='Qolgan qarz ($)'
									value={formatNumber(totalDebt, 2)}
									tone={totalDebt > 0 ? 'danger' : 'success'}
								/>
							</div>

							{/* Payment breakdown */}
							<div>
								<SectionTitle>To'lov tafsilotlari</SectionTitle>
								<div className='grid gap-2 sm:grid-cols-2'>
									<AmountItem label='Dollar ($)' value={money('summ_dollar')} />
									<AmountItem label="Naqd so'm" value={sum('sum_som')} />
									<AmountItem label='Karta' value={sum('summ_cart')} />
									<AmountItem label="O'tkazma" value={sum('sum_transfers')} />
									<AmountItem label='Kurs' value={rate != null ? formatNumber(Number(rate) || 0) : '-'} />
									<AmountItem label='Chegirma ($)' value={money('discount_amount')} />
								</div>
							</div>

							{/* Audit */}
							<div>
								<SectionTitle>Tarix</SectionTitle>
								<div className='grid gap-3 rounded-[3px] border border-ca-border p-3 sm:grid-cols-3'>
									<AuditItem
										icon={<FaUserEdit />}
										label='Kim yaratgan'
										value={pickText(row, 'original_created_by_name', 'created_by_name', 'created_by_detail') || '-'}
									/>
									<AuditItem
										icon={<FaUserTimes className='text-ca-red' />}
										label="Kim o'chirgan"
										value={pickText(row, 'deleted_by_name', 'deleted_by_detail') || '-'}
									/>
									<AuditItem
										icon={<FaClock className='text-ca-red' />}
										label="O'chirilgan vaqt"
										value={
											<span className='text-ca-red'>
												{formatTashkentDateTime(pickText(row, 'deleted_at', 'deleted_time', 'created_time') || null)}
											</span>
										}
									/>
								</div>
							</div>

							{/* Note */}
							{note && (
								<div className='flex items-start gap-2.5 rounded-[3px] border-l-4 border-ca-orange bg-ca-orange/5 px-3 py-2.5'>
									<FaCommentAlt className='mt-0.5 text-ca-orange' />
									<div>
										<div className='text-[11px] text-ca-text'>Izoh</div>
										<div className='wrap-break-word text-ca-heading'>{note}</div>
									</div>
								</div>
							)}
						</div>
					)}
				</ModalBody>

				<ModalFooter>
					<Button type='button' variant='white' onClick={() => setOpen(false)}>
						Yopish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

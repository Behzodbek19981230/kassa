import { useMemo, useState, type ReactNode } from 'react';
import { FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Button, Combobox, Panel, PriceInput, Textarea, useNotification } from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { formatDateTime } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import ConfirmCloseModal from '@/pages/kassa/KassaClosePage/ConfirmCloseModal';
import {
	buildPreview,
	conflictOf,
	EMPTY_LINE,
	hasErrors,
	NO_ERRORS,
	parseServerErrors,
	validate,
	type FormErrors,
	type LineInput,
	type PreviewRow,
} from '@/pages/kassa/KassaClosePage/closeForm';
import { ChannelIcon, DiffPill, ErrorBox, InfoStrip, KTable, KTd, KTh, LoadingBlock, PanelTitle } from '@/pages/kassa/shared';
import { channelLabel, fmtAmount, fmtChannel, fmtSigned, fmtUsd, round2 } from '@/pages/kassa/utils';
import {
	cashRegisterKeys,
	useCashClosingListQuery,
	useCashMovementsQuery,
	useCashRegisterCurrentQuery,
	useCreateCashClosingMutation,
} from '@/services/cash-register/cash-register.queries';
import type { CashRegisterCurrent } from '@/services/cash-register/cash-register.types';
import { useUserListQuery } from '@/services/user/user.queries';
import { ACTIVE_SYSTEM_USER_PARAMS } from '@/services/user/user.types';

function FieldError({ children }: { children?: ReactNode }) {
	if (!children) return null;
	return <div className='mt-1 text-[11px] leading-3 whitespace-normal text-red-500'>{children}</div>;
}

/** "−50 000 so'm · −$ 10" — so'm channels and naqd dollar are summed separately. */
function diffSummary(rows: PreviewRow[], sign: 1 | -1) {
	let som = 0;
	let usd = 0;
	for (const r of rows) {
		if (r.diff === null || Math.sign(r.diff) !== sign) continue;
		if (r.channel.channel === 'cash_usd') usd += r.diff;
		else som += r.diff;
	}
	const parts: string[] = [];
	if (round2(som)) parts.push(`${fmtSigned(som)} so'm`);
	if (round2(usd)) parts.push(fmtChannel(usd, 'cash_usd', true));
	return parts.length ? parts.join(' · ') : '0';
}

function SummaryLine({ label, value, tone }: { label: string; value: ReactNode; tone?: 'red' | 'green' }) {
	return (
		<div className='flex items-baseline justify-between gap-3 py-1'>
			<span className='text-sm text-ca-text'>{label}</span>
			<span
				className={cn(
					'text-lg font-bold text-ca-heading tabular-nums',
					tone === 'red' && 'text-red-500',
					tone === 'green' && 'text-emerald-500',
				)}
			>
				{value}
			</span>
		</div>
	);
}

/** 03 "Kassani topshirish": count the money per channel, hand part of it over, the rest opens the next period. */
export default function KassaClosePage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { notify } = useNotification();
	const { canWrite } = useCurrentCompany();
	const currentQuery = useCashRegisterCurrentQuery();
	// The figures are frozen when the form opens; only a 409 from the server replaces them.
	const [frozen, setFrozen] = useState<CashRegisterCurrent | null>(null);
	const current = frozen ?? currentQuery.data ?? null;
	if (!frozen && currentQuery.data && !currentQuery.isFetching) setFrozen(currentQuery.data);

	const [openedAt] = useState(() => new Date().toISOString());
	const [inputs, setInputs] = useState<Record<string, LineInput>>({});
	const [comment, setComment] = useState('');
	const [receivedBy, setReceivedBy] = useState('');
	const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [conflict, setConflict] = useState<string | null>(null);

	const lastQuery = useCashClosingListQuery({ ordering: '-number', limit: 1 });
	const countsQuery = useCashMovementsQuery({ page: 1, limit: 1 }, Boolean(current && !current.is_initial));
	const usersQuery = useUserListQuery({ ...ACTIVE_SYSTEM_USER_PARAMS, limit: 200 });
	const createMutation = useCreateCashClosingMutation();

	const userOptions = useMemo(
		() =>
			(usersQuery.data?.results ?? [])
				.filter((u) => u.is_active)
				.map((u) => {
					const name = `${u.last_name ?? ''} ${u.first_name ?? ''}`.trim() || u.username;
					return { value: String(u.id), label: u.roles?.name ? `${name} (${u.roles.name})` : name };
				}),
		[usersQuery.data],
	);

	const preview = useMemo(() => (current ? buildPreview(current, inputs) : null), [current, inputs]);

	if (currentQuery.isLoading && !current) {
		return (
			<Panel title={<PanelTitle title='Kassani topshirish' />}>
				<LoadingBlock />
			</Panel>
		);
	}
	if (!current || !preview) {
		return (
			<Panel title={<PanelTitle title='Kassani topshirish' />}>
				<ErrorBox>{getApiErrorMessage(currentQuery.error, "Kassani yuklab bo'lmadi")}</ErrorBox>
			</Panel>
		);
	}

	const isInitial = current.is_initial;
	const { rows, usd, diffRows } = preview;
	const nextNumber = (lastQuery.data?.results[0]?.number ?? current.previous?.number ?? 0) + 1;
	const sourceCount = (source: string) => current.sources.find((s) => s.source === source)?.count ?? 0;

	function setLine(code: string, patch: Partial<LineInput>) {
		setInputs((prev) => ({ ...prev, [code]: { ...(prev[code] ?? EMPTY_LINE), ...patch } }));
		setErrors((prev) => {
			if (!prev.lines[code]) return prev;
			const lines = { ...prev.lines };
			delete lines[code];
			return { ...prev, lines };
		});
	}

	function openConfirm() {
		const next = validate(rows, comment, receivedBy, isInitial);
		setErrors(next);
		if (hasErrors(next)) return;
		setConflict(null);
		setConfirmOpen(true);
	}

	async function submit() {
		if (!current) return;
		try {
			const closing = await createMutation.mutateAsync({
				state_token: current.state_token,
				lines: current.channels.map((ch) => {
					const input = inputs[ch.code] ?? EMPTY_LINE;
					return {
						channel: ch.channel,
						card: ch.channel === 'card' ? ch.card : null,
						actual: input.actual || '0',
						handed_over: input.handed_over || '0',
					};
				}),
				comment: comment.trim(),
				received_by: receivedBy ? Number(receivedBy) : null,
			});
			setConfirmOpen(false);
			notify({ title: 'Kassa topshirildi', text: `Topshirish akti #${closing.number} yaratildi` });
			navigate(`/kassa/closings/${closing.id}`, { replace: true });
		} catch (err) {
			const changed = conflictOf(err);
			if (changed) {
				// Keep what the user typed; only "Dasturda"/"Farq" (and the token) are replaced.
				setFrozen(changed.current);
				queryClient.setQueryData(cashRegisterKeys.current(), changed.current);
				setConflict(changed.detail || null);
				return;
			}
			if (isAxiosError(err) && err.response?.status === 400) {
				setErrors(parseServerErrors(err.response.data, current.channels.map((c) => c.code)));
				setConfirmOpen(false);
				return;
			}
			notify({ title: 'Xatolik', text: getApiErrorMessage(err, "Kassani topshirib bo'lmadi") });
		}
	}

	// Column shares (sum to 100%): "Kanal" stays narrow, the amount columns get the rest.
	const col = isInitial
		? {
				channel: 'w-[20%]',
				opening: 'w-[15%]',
				turnover: 'w-[15%]',
				expected: '',
				actual: 'w-[18%]',
				diff: '',
				handed: 'w-[18%]',
				rest: 'w-[14%]',
			}
		: {
				channel: 'w-[15%]',
				opening: 'w-[11%]',
				turnover: 'w-[11%]',
				expected: 'w-[11%]',
				actual: 'w-[13%]',
				diff: 'w-[16%]',
				handed: 'w-[13%]',
				rest: 'w-[10%]',
			};

	const periodText = isInitial
		? `Boshlang'ich qoldiq → ${formatDateTime(openedAt)}`
		: `${formatDateTime(current.period_start)} → ${formatDateTime(openedAt)}`;

	return (
		<Panel
			title={
				<PanelTitle
					title={isInitial ? "Boshlang'ich qoldiq" : 'Kassani topshirish'}
					sub={`#${nextNumber} (qoralama)`}
				/>
			}
		>
			<div className='space-y-3'>
				{!canWrite && (
					<InfoStrip tone='red'>Tanlangan kompaniya sizning savdo kompaniyangiz emas: faqat ko'rishga ruxsat bor.</InfoStrip>
				)}
				<InfoStrip>
					{isInitial ? (
						<>
							<b>Hali topshirish yo'q.</b> Kassadagi pulni sanab, <b>Qo'limda</b> ustuniga kiriting, kartalar uchun bank
							ilovasidagi qoldiqni yozing. Sanalgan summa kassaning boshlang'ich qoldig'i bo'ladi, farq hisoblanmaydi.
						</>
					) : (
						<>
							Davr: <b>{periodText}</b>. <b>Qo'limda</b> ustuniga sanab chiqqan pulingizni, kartalar uchun bank
							ilovasidagi qoldiqni kiriting. <b>Topshirildi</b> = kassadan olib ketilayotgan summa. <b>Qoldiq</b> =
							keyingi davr boshidagi summa.
						</>
					)}
				</InfoStrip>

				{errors.general.length > 0 && (
					<ErrorBox>
						{errors.general.map((e, i) => (
							<span key={i} className='block'>
								{e}
							</span>
						))}
					</ErrorBox>
				)}

				{/* Fixed layout: typing into the inputs changes Farq/Qoldiq, which must not resize the columns;
				    an amount too long for its column is cut with "…" instead of spilling into the next one. */}
				<KTable
					tableClassName={cn(
						'table-fixed [&_td]:overflow-hidden [&_td]:text-ellipsis',
						isInitial ? 'min-w-[870px]' : 'min-w-[1210px]',
					)}
				>
					<thead>
						<tr>
							<KTh className={col.channel}>Kanal</KTh>
							<KTh align='right' className={col.opening}>
								Davr boshi
							</KTh>
							<KTh align='right' className={col.turnover}>
								Aylanma
							</KTh>
							{!isInitial && (
								<KTh align='right' className={col.expected}>
									Dasturda
								</KTh>
							)}
							<KTh align='right' className={col.actual}>
								Qo'limda (sanaldi)
							</KTh>
							{!isInitial && (
								<KTh align='right' className={col.diff}>
									Farq
								</KTh>
							)}
							<KTh align='right' className={col.handed}>
								Topshirildi
							</KTh>
							<KTh align='right' className={col.rest}>
								Qoldiq
							</KTh>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => {
							const ch = r.channel;
							const lineErrors = errors.lines[ch.code];
							// 12 digits = up to 999 mlrd so'm; naqd dollar up to $ 999 mln.
							const maxDigits = ch.channel === 'cash_usd' ? 9 : 12;
							return (
								<tr key={ch.code}>
									<KTd>
										<span className='flex min-w-0 items-center gap-2' title={channelLabel(ch)}>
											<ChannelIcon channel={ch.channel} />
											<span className='truncate'>{channelLabel(ch)}</span>
										</span>
										<FieldError>{lineErrors?.card}</FieldError>
									</KTd>
									<KTd align='right' className='text-ca-text'>
										{fmtChannel(r.opening, ch.channel)}
									</KTd>
									<KTd align='right'>{fmtChannel(r.turnover, ch.channel)}</KTd>
									{!isInitial && (
										<KTd align='right' className='font-bold'>
											{fmtChannel(r.expected, ch.channel)}
										</KTd>
									)}
									<KTd align='right'>
										<PriceInput
											value={r.input.actual}
											onChange={(v) => setLine(ch.code, { actual: v })}
											placeholder='0'
											maxIntegerDigits={maxDigits}
											aria-label={`${channelLabel(ch)}: sanalgan summa`}
											className={cn(
												'h-9! text-right text-sm font-semibold lg:h-9! lg:text-sm',
												lineErrors?.actual && 'border-red-500',
											)}
										/>
										<FieldError>{lineErrors?.actual}</FieldError>
									</KTd>
									{!isInitial && (
										<KTd align='right'>
											{r.diff === null ? (
												<span className='text-ca-text/60'>—</span>
											) : (
												<span className='inline-flex items-center gap-1.5'>
													<span
														className={cn(
															r.diff < 0 && 'text-red-500',
															r.diff > 0 && 'text-emerald-500',
															r.diff === 0 && 'text-ca-text',
														)}
													>
														{fmtSigned(r.diff)}
													</span>
													<DiffPill value={r.diff} />
												</span>
											)}
										</KTd>
									)}
									<KTd align='right'>
										<PriceInput
											value={r.input.handed_over}
											onChange={(v) => setLine(ch.code, { handed_over: v })}
											placeholder='0'
											maxIntegerDigits={maxDigits}
											aria-label={`${channelLabel(ch)}: topshirilgan summa`}
											className={cn(
												'h-9! text-right text-sm font-semibold lg:h-9! lg:text-sm',
												lineErrors?.handed_over && 'border-red-500',
											)}
										/>
										<FieldError>{lineErrors?.handed_over}</FieldError>
									</KTd>
									<KTd align='right' className={cn(r.rest !== null && r.rest < 0 && 'text-red-500')}>
										{r.rest === null ? <span className='text-ca-text/60'>—</span> : fmtChannel(r.rest, ch.channel)}
									</KTd>
								</tr>
							);
						})}
						<tr className='bg-ca-silver'>
							<KTd className='font-bold whitespace-normal'>
								Jami ($ ekv.
								{current.exchange_rate ? `, 1$ = ${fmtAmount(current.exchange_rate)}` : ''})
							</KTd>
							<KTd align='right' className='font-bold'>
								{fmtUsd(usd.opening)}
							</KTd>
							<KTd align='right' className='font-bold'>
								{fmtUsd(usd.turnover)}
							</KTd>
							{!isInitial && (
								<KTd align='right' className='font-bold'>
									{fmtUsd(usd.expected)}
								</KTd>
							)}
							<KTd align='right' className='font-bold'>
								{fmtUsd(usd.actual)}
							</KTd>
							{!isInitial && (
								<KTd
									align='right'
									className={cn('font-bold', (usd.diff ?? 0) < 0 && 'text-red-500', (usd.diff ?? 0) > 0 && 'text-emerald-500')}
								>
									{fmtUsd(usd.diff, { signed: true })}
								</KTd>
							)}
							<KTd align='right' className='font-bold'>
								{fmtUsd(usd.handed)}
							</KTd>
							<KTd align='right' className='font-bold'>
								{fmtUsd(usd.rest)}
							</KTd>
						</tr>
					</tbody>
				</KTable>

				<div className='grid grid-cols-1 gap-4 lg:grid-cols-[1fr_minmax(300px,420px)]'>
					<div className='space-y-3'>
						<label className='block'>
							<span className='mb-1 block text-sm text-ca-heading'>
								Izoh <span className='text-red-500'>*</span>
							</span>
							<Textarea
								rows={3}
								maxLength={2000}
								value={comment}
								onChange={(e) => {
									setComment(e.target.value);
									if (errors.comment) setErrors((prev) => ({ ...prev, comment: undefined }));
								}}
								placeholder={diffRows.length ? 'Farq sababini yozing…' : 'Izoh yozing…'}
								className={cn('lg:text-sm', errors.comment && 'border-red-500')}
							/>
							<FieldError>{errors.comment}</FieldError>
						</label>
						<div className='max-w-sm'>
							<span className='mb-1 block text-sm text-ca-heading'>
								Qabul qiluvchi <span className='text-red-500'>*</span>
							</span>
							<div className={cn('rounded-[3px]', errors.received_by && 'ring-1 ring-red-500')}>
								<Combobox
									value={receivedBy}
									onChange={(v) => {
										setReceivedBy(v);
										if (errors.received_by) setErrors((prev) => ({ ...prev, received_by: undefined }));
									}}
									options={userOptions}
									placeholder={usersQuery.isLoading ? 'Yuklanmoqda…' : 'Tanlang'}
									clearable
								/>
							</div>
							<FieldError>{errors.received_by}</FieldError>
						</div>
					</div>

					<div className='rounded-md border border-ca-border bg-ca-silver px-4 py-3'>
						{!isInitial && (
							<>
								<SummaryLine label='Buyurtmalar' value={`${sourceCount('order')} ta`} />
								<SummaryLine label="Qarz to'lovlari" value={`${sourceCount('debt')} ta`} />
								<SummaryLine label='Xarajatlar' value={`${sourceCount('expense')} ta`} />
								{sourceCount('vozvrat') > 0 && <SummaryLine label='Vozvrat' value={`${sourceCount('vozvrat')} ta`} />}
								<SummaryLine
									label='Tuzatishlar'
									value={countsQuery.data ? `${countsQuery.data.counts.correction} ta` : '—'}
								/>
								<SummaryLine label='Kamomad' value={diffSummary(diffRows, -1)} tone={diffRows.some((r) => (r.diff ?? 0) < 0) ? 'red' : undefined} />
								<SummaryLine label='Ortiqcha' value={diffSummary(diffRows, 1)} tone={diffRows.some((r) => (r.diff ?? 0) > 0) ? 'green' : undefined} />
							</>
						)}
						{isInitial && (
							<SummaryLine label="Boshlang'ich qoldiq ($ ekv.)" value={fmtUsd(usd.actual)} />
						)}
						<div className='mt-3 flex justify-end gap-2'>
							<Button type='button' variant='white' size='sm' onClick={() => navigate('/kassa/current')}>
								Bekor qilish
							</Button>
							<Button type='button' variant='success' size='sm' disabled={!canWrite} onClick={openConfirm}>
								<FaLock className='mr-1.5' /> {isInitial ? 'Qoldiqni saqlash' : 'Topshirishni yakunlash'}
							</Button>
						</div>
					</div>
				</div>
			</div>

			<ConfirmCloseModal
				open={confirmOpen}
				onOpenChange={(open) => {
					setConfirmOpen(open);
					if (!open) setConflict(null);
				}}
				rows={rows}
				diffCount={diffRows.length}
				isInitial={isInitial}
				newPeriodStart={formatDateTime(new Date().toISOString())}
				conflict={conflict}
				submitting={createMutation.isPending}
				onConfirm={submit}
			/>
		</Panel>
	);
}

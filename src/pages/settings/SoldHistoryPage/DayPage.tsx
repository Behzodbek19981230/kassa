import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { FaPrint } from 'react-icons/fa';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Combobox, Skeleton, useNotification } from '@/components/ui';
import { loadBlobIntoTab, openPendingTab } from '@/lib/blob';
import { getApiErrorMessage, getApiErrorMessageAsync } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { useSoldDayDebtsQuery, useSoldDayOrdersQuery } from '@/services/sold-history/sold-history.queries';
import { soldHistoryService } from '@/services/sold-history/sold-history.service';
import type { SoldClientRef, SoldDayDebtRow, SoldDayOrderRow } from '@/services/sold-history/sold-history.types';
import {
	Card,
	EmptyState,
	ErrorState,
	FieldLabel,
	ListFooter,
	PageHeader,
	SectionDivider,
	StatTiles,
} from '@/pages/settings/soldShared';
import { money, moneyStat, parseIsoDay } from '@/pages/settings/soldUtils';

const PAGE_SIZE = 30;
const LIST_GRID = 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
const UNKNOWN_CLIENT = "Noma'lum mijoz";

function mergeClients(...lists: (SoldClientRef[] | undefined)[]) {
	const byId = new Map<number, SoldClientRef>();
	for (const list of lists) for (const c of list ?? []) byId.set(c.id, c);
	return [...byId.values()].sort((a, b) => a.fio.localeCompare(b.fio));
}

/** One day of "Sotilgan tovarlar tarixi": the day's orders and debt repayments, each with totals and a 30-row list. */
export default function SoldHistoryDayPage() {
	const { date = '' } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { notify } = useNotification();
	const backTo = (location.state as { back?: string } | null)?.back ?? '/settings/sold-history';

	const [client, setClient] = useState('');
	const [ordersPage, setOrdersPage] = useState(1);
	const [debtsPage, setDebtsPage] = useState(1);
	const [clients, setClients] = useState<SoldClientRef[]>([]);
	const [printing, setPrinting] = useState<string | null>(null);

	const clientId = client ? Number(client) : undefined;
	const orders = useSoldDayOrdersQuery(date, { page: ordersPage, page_size: PAGE_SIZE, client: clientId });
	const debts = useSoldDayDebtsQuery(date, { page: debtsPage, page_size: PAGE_SIZE, client: clientId });

	// The client list comes only with page=1 (always the whole day's clients), so it is kept once loaded.
	const pageOneClients = useMemo(
		() =>
			mergeClients(
				orders.data?.pagination.currentPage === 1 ? orders.data.clients : undefined,
				debts.data?.pagination.currentPage === 1 ? debts.data.clients : undefined,
			),
		[orders.data, debts.data],
	);
	useEffect(() => {
		if (pageOneClients.length) setClients((prev) => mergeClients(prev, pageOneClients));
	}, [pageOneClients]);

	const clientOptions = useMemo(() => clients.map((c) => ({ value: String(c.id), label: c.fio })), [clients]);

	function changeClient(value: string) {
		setClient(value);
		setOrdersPage(1);
		setDebtsPage(1);
	}

	async function print(kind: 'order' | 'debt', id: number) {
		const tab = openPendingTab();
		setPrinting(`${kind}-${id}`);
		try {
			const blob = kind === 'order' ? await soldHistoryService.printOrder(id) : await soldHistoryService.printDebt(id);
			loadBlobIntoTab(blob, tab);
		} catch (err) {
			tab?.close();
			notify({ title: 'Xatolik', text: await getApiErrorMessageAsync(err, "PDF yuklab bo'lmadi") });
		} finally {
			setPrinting(null);
		}
	}

	const label = orders.data?.date_label ?? debts.data?.date_label ?? date;
	const ot = orders.data?.totals;
	const dt = debts.data?.totals;

	return (
		<div>
			<PageHeader
				title={label}
				subtitle={`${parseIsoDay(date).weekday} · sotilgan tovarlar`}
				onBack={() => navigate(backTo)}
				actions={
					<label className='w-56'>
						<FieldLabel>Mijoz</FieldLabel>
						<Combobox
							clearable
							value={client}
							onChange={changeClient}
							options={clientOptions}
							selectedLabel={clients.find((c) => String(c.id) === client)?.fio}
							placeholder='Barcha mijozlar'
							searchPlaceholder='Qidirish...'
						/>
					</label>
				}
			/>

			<Card className='mb-4 p-4'>
				<SectionTitle title='Buyurtmalar' count={ot?.count} />
				{ot && (
					<StatTiles
						items={[
							moneyStat('Summa dollar', ot.sum_dollar, '$'),
							moneyStat("Summa so'm", ot.sum_som),
							moneyStat('Summa karta', ot.sum_cart),
							moneyStat('Summa transfer', ot.sum_transfers),
							moneyStat("Qaytim so'm", ot.zdacha_sum),
							moneyStat('Qaytim dollar', ot.zdacha_dollar, '$'),
						]}
						highlight={{ label: "Jami to'langan ($)", value: `${money(ot.all_summ_dollar)} $` }}
					/>
				)}
				<ListBody
					title="Buyurtmalar ro'yxati"
					isLoading={orders.isLoading}
					error={orders.isError ? getApiErrorMessage(orders.error, "Buyurtmalarni yuklab bo'lmadi") : null}
					isEmpty={!orders.data?.results.length}
					emptyText="Bu kunda buyurtma yo'q."
				>
					{orders.data?.results.map((row) => (
						<OrderRow
							key={row.id}
							row={row}
							printing={printing === `order-${row.id}`}
							onOpen={() => navigate(`/customer-order-history/${row.id}`)}
							onPrint={() => print('order', row.id)}
						/>
					))}
				</ListBody>
				<ListFooter pagination={orders.data?.pagination} unit='buyurtma' onPageChange={setOrdersPage} />
			</Card>

			<Card>
				<SectionTitle title="Qarz to'lagan mijozlar" count={dt?.count} tone='red' />
				{dt && (
					<StatTiles
						tone='red'
						items={[
							moneyStat("To'langan qarz dollar", dt.sum_dollar, '$'),
							moneyStat("To'langan qarz so'm", dt.sum_som),
							moneyStat("To'langan qarz karta", dt.sum_cart),
							moneyStat("To'langan qarz transfer", dt.sum_transfers),
							moneyStat("Qaytim so'm", dt.zdacha_sum),
							moneyStat('Qaytim dollar', dt.zdacha_dollar, '$'),
						]}
						highlight={{ label: "Jami to'langan qarz ($)", value: `${money(dt.paid_debt_dollar)} $` }}
					/>
				)}
				<ListBody
					title="To'lovlar ro'yxati"
					isLoading={debts.isLoading}
					error={debts.isError ? getApiErrorMessage(debts.error, "Qarz to'lovlarini yuklab bo'lmadi") : null}
					isEmpty={!debts.data?.results.length}
					emptyText="Bu kunda qarz to'lovi yo'q."
				>
					{debts.data?.results.map((row) => (
						<DebtRow
							key={row.id}
							row={row}
							printing={printing === `debt-${row.id}`}
							onPrint={() => print('debt', row.id)}
						/>
					))}
				</ListBody>
				<ListFooter pagination={debts.data?.pagination} unit="to'lov" onPageChange={setDebtsPage} />
			</Card>
		</div>
	);
}

function SectionTitle({ title, count, tone = 'theme' }: { title: string; count?: number; tone?: 'theme' | 'red' }) {
	return (
		<div className='mb-3 flex items-center gap-2'>
			<h2 className='text-base font-semibold text-ca-heading'>{title}</h2>
			{count !== undefined && (
				<span
					className={cn(
						'rounded-full px-2 py-0.5 text-[11px] font-semibold',
						tone === 'red' ? 'bg-ca-red/10 text-ca-red' : 'bg-ca-theme/10 text-ca-theme',
					)}
				>
					{count} ta
				</span>
			)}
		</div>
	);
}

function ListBody({
	title,
	isLoading,
	error,
	isEmpty,
	emptyText,
	children,
}: {
	title: string;
	isLoading: boolean;
	error: string | null;
	isEmpty: boolean;
	emptyText: string;
	children: ReactNode;
}) {
	let body: ReactNode;
	if (isLoading) {
		body = (
			<div className={LIST_GRID}>
				{Array.from({ length: 8 }, (_, i) => (
					<Skeleton key={i} className='h-[62px] rounded-lg' />
				))}
			</div>
		);
	} else if (error) {
		body = <ErrorState>{error}</ErrorState>;
	} else if (isEmpty) {
		body = <EmptyState>{emptyText}</EmptyState>;
	} else {
		body = <div className={LIST_GRID}>{children}</div>;
	}
	return (
		<>
			<SectionDivider className='mt-5 mb-3'>{title}</SectionDivider>
			{body}
		</>
	);
}

function NumberBadge({ value, tone = 'theme' }: { value: number; tone?: 'theme' | 'red' }) {
	return (
		<span
			className={cn(
				'flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg px-2 text-base font-bold text-white tabular-nums shadow-sm',
				tone === 'red' ? 'bg-ca-red' : 'bg-ca-theme',
			)}
		>
			{value}
		</span>
	);
}

const ROW = 'flex items-center gap-3 rounded-lg border border-ca-border bg-ca-silver px-3 py-2.5';

function PrintButton({ printing, onClick }: { printing: boolean; onClick: () => void }) {
	return (
		<button
			type='button'
			onClick={onClick}
			disabled={printing}
			title='Chop qilish'
			aria-label='Chop qilish'
			className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ca-orange/40 bg-ca-orange/10 text-xs text-ca-orange hover:bg-ca-orange/20 disabled:opacity-50'
		>
			{printing ? (
				<span className='h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent' />
			) : (
				<FaPrint />
			)}
		</button>
	);
}

function OrderRow({
	row,
	printing,
	onOpen,
	onPrint,
}: {
	row: SoldDayOrderRow;
	printing: boolean;
	onOpen: () => void;
	onPrint: () => void;
}) {
	const isVozvrat = row.is_vozvrat === 1;
	const isUnconfirmed = row.order_account_status === false;
	return (
		<div className={ROW}>
			<NumberBadge value={row.number} />
			<div className='min-w-0 flex-1'>
				<button
					type='button'
					onClick={onOpen}
					className='block max-w-full truncate text-left text-sm font-semibold text-ca-theme hover:underline'
					title={row.client?.fio ?? UNKNOWN_CLIENT}
				>
					{row.client?.fio ?? UNKNOWN_CLIENT}
				</button>
				<div className='mt-0.5 flex items-center gap-1 text-xs text-ca-text'>
					<span>{row.time}</span>
					{isVozvrat && <span className='rounded bg-ca-red/10 px-1 text-ca-red'>Vozvrat</span>}
					{isUnconfirmed && <span className='rounded bg-ca-orange/10 px-1 text-ca-orange'>Tasdiqlanmagan</span>}
					{row.is_sent === 1 && <span className='rounded bg-ca-aqua/10 px-1 text-ca-aqua'>Dastavka</span>}
				</div>
			</div>
			<span
				className='shrink-0 text-right text-base font-bold text-ca-heading tabular-nums'
				title={`To'lanadigan: ${money(row.all_product_sum)} $`}
			>
				{money(row.all_summ_dollar)} $
			</span>
			<PrintButton printing={printing} onClick={onPrint} />
		</div>
	);
}

function DebtRow({ row, printing, onPrint }: { row: SoldDayDebtRow; printing: boolean; onPrint: () => void }) {
	return (
		<div className={ROW}>
			<NumberBadge value={row.number} tone='red' />
			<div className='min-w-0 flex-1'>
				<div className='truncate text-sm font-semibold text-ca-heading' title={row.client?.fio ?? UNKNOWN_CLIENT}>
					{row.client?.fio ?? UNKNOWN_CLIENT}
				</div>
				<div className='mt-0.5 text-xs text-ca-text'>{row.time}</div>
			</div>
			<span className='shrink-0 text-base font-bold text-ca-red tabular-nums'>{money(row.paid_debt_dollar)} $</span>
			<PrintButton printing={printing} onClick={onPrint} />
		</div>
	);
}

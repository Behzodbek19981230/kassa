import { FaExclamationTriangle } from 'react-icons/fa';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/number';
import { useOrderAccountHistoryChangeLogsQuery } from '@/services/order-account-history/order-account-history.queries';
import type {
	OrderAccountHistoryChangeLog,
	OrderAccountHistoryChangeLogChange,
	OrderAccountHistoryChangeLogUserDetail,
} from '@/services/order-account-history/order-account-history.types';

interface OrderChangeLogsModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	orderId?: number;
}

function formatDateTime(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	const date = d.toLocaleDateString('ru-RU');
	const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	return `${date} ${time}`;
}

function userLabel(u: OrderAccountHistoryChangeLogUserDetail) {
	return `${u.last_name} ${u.first_name}`.trim() || u.username;
}

const productActionCardClass: Record<'added' | 'removed' | 'changed', string> = {
	added: 'border-ca-green bg-ca-green/5',
	removed: 'border-ca-red bg-ca-red/5',
	changed: 'border-ca-orange bg-ca-orange/5',
};

const productActionLabel: Record<'added' | 'removed' | 'changed', string> = {
	added: "Qo'shildi",
	removed: "O'chirildi",
	changed: "O'zgardi",
};

function ChangeRow({ change, index }: { change: OrderAccountHistoryChangeLogChange; index: number }) {
	if (change.type === 'field') {
		return (
			<p key={index} className='text-xs text-ca-text'>
				<span className='font-semibold text-ca-heading'>{change.label}:</span> {formatNumber(change.old)}{' '}
				<span aria-hidden>→</span> <span className='font-semibold text-ca-heading'>{formatNumber(change.new)}</span>
			</p>
		);
	}

	return (
		<div key={index} className={cn('rounded border-l-4 p-2 text-xs', productActionCardClass[change.action])}>
			<p className='font-semibold text-ca-heading'>
				{productActionLabel[change.action]}: {change.label}
			</p>
			<div className='mt-1 space-y-0.5 text-ca-text'>
				{change.action === 'changed' &&
					change.changes?.map((fieldChange, i) => (
						<p key={i}>
							{fieldChange.label}: {formatNumber(fieldChange.old)} <span aria-hidden>→</span>{' '}
							{formatNumber(fieldChange.new)}
						</p>
					))}
				{change.action === 'added' && change.new && (
					<>
						<p>Soni: {formatNumber(change.new.count)}</p>
						<p>Narx: {formatNumber(change.new.price, 2)}</p>
					</>
				)}
				{change.action === 'removed' && change.old && (
					<>
						<p>Soni: {formatNumber(change.old.count)}</p>
						<p>Narx: {formatNumber(change.old.price, 2)}</p>
					</>
				)}
			</div>
		</div>
	);
}

function ChangeLogCard({ log }: { log: OrderAccountHistoryChangeLog }) {
	return (
		<div className='rounded border border-ca-border p-3'>
			<div className='mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ca-text'>
				<span className='font-semibold text-ca-heading'>{formatDateTime(log.created_time)}</span>
				<span>Hodim: {userLabel(log.user_detail)}</span>
			</div>
			<div className='space-y-2'>
				{log.changes.length === 0 ? (
					<p className='text-xs text-ca-text'>{log.text}</p>
				) : (
					log.changes.map((change, i) => <ChangeRow key={i} change={change} index={i} />)
				)}
			</div>
		</div>
	);
}

export default function OrderChangeLogsModal({ open, setOpen, orderId }: OrderChangeLogsModalProps) {
	const { data, isLoading, isError } = useOrderAccountHistoryChangeLogsQuery(orderId, open);
	const logs = data?.results ?? [];

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-2xl'>
				<ModalHeader>
					<ModalTitle>O'zgarishlar tarixi</ModalTitle>
				</ModalHeader>
				<ModalBody className='max-h-[70vh] space-y-3 overflow-y-auto'>
					{isLoading && <p className='text-center'>Yuklanmoqda...</p>}
					{!isLoading && isError && (
						<p className='flex items-center justify-center gap-2 text-ca-red'>
							<FaExclamationTriangle /> Xatolik yuz berdi
						</p>
					)}
					{!isLoading && !isError && logs.length === 0 && (
						<p className='text-center text-ca-text'>O'zgarishlar tarixi topilmadi</p>
					)}
					{!isLoading &&
						!isError &&
						logs.map((log) => <ChangeLogCard key={log.id} log={log} />)}
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}

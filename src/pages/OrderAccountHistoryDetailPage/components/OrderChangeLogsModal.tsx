import { type UIEvent, useState } from 'react';
import { FaArrowLeft, FaExclamationTriangle, FaEye, FaSpinner } from 'react-icons/fa';
import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	ModalTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/number';
import { useOrderAccountHistoryChangeLogsQuery } from '@/services/order-account-history/order-account-history.queries';
import type {
	OrderAccountHistoryChangeLog,
	OrderAccountHistoryChangeLogChange,
} from '@/services/order-account-history/order-account-history.types';

interface OrderChangeLogsModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	orderId?: number;
}

const productActionCardClass: Record<'added' | 'removed' | 'changed', string> = {
	added: 'border-ca-green bg-ca-green/5',
	removed: 'border-ca-red bg-ca-red/5',
	changed: 'border-ca-orange bg-ca-orange/5',
};

const productActionLabel: Record<'added' | 'removed', string> = {
	added: "Qo'shildi",
	removed: "O'chirildi",
};

function ChangeRow({ change, index }: { change: OrderAccountHistoryChangeLogChange; index: number }) {
	if (change.type === 'field') {
		return (
			<p key={index} className='text-xs text-ca-heading'>
				<span className='font-semibold'>{change.label}:</span> {formatNumber(change.old)}{' '}
				<span aria-hidden>→</span> <span className='font-semibold'>{formatNumber(change.new)}</span>
			</p>
		);
	}

	const snapshot = change.action === 'removed' ? change.old : change.new;

	return (
		<div key={index} className={cn('rounded border-l-4 p-2 text-xs', productActionCardClass[change.action])}>
			{change.action !== 'changed' && (
				<p className='font-semibold text-ca-heading'>{productActionLabel[change.action]}</p>
			)}
			<p className='font-semibold text-ca-heading'>{change.label}</p>
			<div className='mt-1 space-y-0.5 text-ca-text'>
				{change.action === 'changed' &&
					change.changes?.map((fieldChange, i) => (
						<p key={i}>
							{fieldChange.label}: {formatNumber(fieldChange.old)} <span aria-hidden>→</span>{' '}
							{formatNumber(fieldChange.new)}
						</p>
					))}
				{change.action !== 'changed' && snapshot && (
					<>
						<p>Soni: {formatNumber(snapshot.count)}</p>
						<p>Narx: {formatNumber(snapshot.price, 2)}</p>
						<p>Haqiqiy narx: {formatNumber(snapshot.real_price, 2)}</p>
						<p>Foyda: {formatNumber(snapshot.profit, 2)}</p>
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
				<span className='font-semibold text-ca-heading'>{log.created_time_label}</span>
				<span>Hodim: {log.user_name}</span>
			</div>
			{log.text && (
				<p className='mb-3 rounded border-l-4 border-ca-theme bg-ca-theme/10 px-3 py-2 text-sm font-semibold text-ca-heading'>
					{log.text}
				</p>
			)}
			<div className='space-y-2'>
				{log.changes.map((change, i) => (
					<ChangeRow key={i} change={change} index={i} />
				))}
			</div>
		</div>
	);
}

// Logs are listed as table rows; the eye button opens one log's full card in the same modal.
export default function OrderChangeLogsModal({ open, setOpen, orderId }: OrderChangeLogsModalProps) {
	const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useOrderAccountHistoryChangeLogsQuery(orderId, open);
	const logs = data?.pages.flatMap((page) => page.results) ?? [];
	const [selectedLog, setSelectedLog] = useState<OrderAccountHistoryChangeLog | null>(null);

	function handleOpenChange(next: boolean) {
		if (!next) setSelectedLog(null);
		setOpen(next);
	}

	function handleScroll(e: UIEvent<HTMLDivElement>) {
		if (selectedLog || !hasNextPage || isFetchingNextPage) return;
		const el = e.currentTarget;
		if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
			fetchNextPage();
		}
	}

	return (
		<Modal open={open} onOpenChange={handleOpenChange}>
			<ModalContent className='max-w-4xl'>
				<ModalHeader>
					<ModalTitle>O'zgarishlar tarixi</ModalTitle>
				</ModalHeader>
				<ModalBody className='max-h-[70vh] space-y-3 overflow-y-auto' onScroll={handleScroll}>
					{selectedLog ? (
						<>
							<div className='flex flex-wrap items-center gap-3'>
								<Button type='button' variant='info' size='xs' onClick={() => setSelectedLog(null)}>
									<FaArrowLeft className='mr-1.5' /> Orqaga
								</Button>
								{selectedLog.direction && (
									<span className='inline-flex items-center gap-1.5 text-xs text-ca-text'>
										Holati:
										<span className='rounded-full border border-ca-orange bg-ca-orange/10 px-2.5 py-0.5 font-semibold text-ca-orange'>
											{selectedLog.direction}
										</span>
									</span>
								)}
							</div>
							<ChangeLogCard log={selectedLog} />
						</>
					) : (
						<>
							{isLoading && <p className='text-center'>Yuklanmoqda...</p>}
							{!isLoading && isError && (
								<p className='flex items-center justify-center gap-2 text-ca-red'>
									<FaExclamationTriangle /> {getApiErrorMessage(error, 'Xatolik yuz berdi')}
								</p>
							)}
							{!isLoading && !isError && logs.length === 0 && (
								<p className='text-center text-ca-text'>Hali o'zgarishlar yo'q</p>
							)}
							{!isLoading && !isError && logs.length > 0 && (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='bg-ca-theme text-white'>#</TableHead>
											<TableHead className='bg-ca-theme text-white'>Sana</TableHead>
											<TableHead className='bg-ca-theme text-white'>Hodim</TableHead>
											<TableHead className='bg-ca-theme text-white'>Izoh</TableHead>
											<TableHead className='bg-ca-theme text-white'>O'zgarishlar</TableHead>
											<TableHead className='bg-ca-theme text-white' />
										</TableRow>
									</TableHeader>
									<TableBody>
										{logs.map((log, i) => (
											<TableRow key={log.id}>
												<TableCell>{i + 1}</TableCell>
												<TableCell className='whitespace-nowrap'>{log.created_time_label}</TableCell>
												<TableCell>{log.user_name}</TableCell>
												<TableCell>{log.text}</TableCell>
												<TableCell>{formatNumber(log.changes.length)}</TableCell>
												<TableCell className='text-right'>
													<Button
														type='button'
														variant='theme'
														size='icon'
														aria-label="Ko'rish"
														onClick={() => setSelectedLog(log)}
													>
														<FaEye />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
							{isFetchingNextPage && (
								<p className='flex items-center justify-center gap-2 text-ca-text'>
									<FaSpinner className='animate-spin' /> Yuklanmoqda...
								</p>
							)}
						</>
					)}
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}

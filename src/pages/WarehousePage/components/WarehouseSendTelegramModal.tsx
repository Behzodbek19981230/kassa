import { useEffect, useState, type FormEvent } from 'react';
import { FaSpinner } from 'react-icons/fa';
import {
	Button,
	FormField,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	MultiCombobox,
	RadioGroup,
	Textarea,
	useNotification,
} from '@/components/ui';
import type { ComboboxLoadParams, ComboboxLoadResult } from '@/components/ui';
import { clientService } from '@/services/client/client.service';
import {
	useCreateAllTelegramBroadcastMutation,
	useCreateTelegramBroadcastMutation,
} from '@/services/telegram-broadcast/telegram-broadcast.queries';
import type { Warehouse } from '@/services/warehouse/warehouse.types';

interface WarehouseSendTelegramModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: Warehouse;
	productLabel: string;
}

export default function WarehouseSendTelegramModal({
	open,
	setOpen,
	item,
	productLabel,
}: WarehouseSendTelegramModalProps) {
	const { notify } = useNotification();
	const [target, setTarget] = useState<'all' | 'selected'>('all');
	const [clientIds, setClientIds] = useState<string[]>([]);
	const [text, setText] = useState('');
	const [formError, setFormError] = useState('');
	const [allClientsCount, setAllClientsCount] = useState<number | null>(null);
	const [loadingCount, setLoadingCount] = useState(false);

	const createMutation = useCreateTelegramBroadcastMutation();
	const createAllMutation = useCreateAllTelegramBroadcastMutation();
	const isSubmitting = createMutation.isPending || createAllMutation.isPending;

	useEffect(() => {
		if (!open || allClientsCount !== null) return;
		setLoadingCount(true);
		clientService
			.list({ page: 1, limit: 1, is_telegram_started: 1, status: 'confirmed_telegram' })
			.then((result) => setAllClientsCount(result.pagination.total))
			.catch(() => setAllClientsCount(0))
			.finally(() => setLoadingCount(false));
	}, [open, allClientsCount]);

	const loadClientOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await clientService.list({
			search: search || undefined,
			page,
			limit: 20,
			is_telegram_started: 1,
			status: 'confirmed_telegram',
		});
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: `${c.fio} — ${c.phone}` })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setFormError('');
		if (target === 'selected' && clientIds.length === 0) {
			setFormError('Kamida bitta mijoz tanlanishi shart');
			return;
		}

		try {
			if (target === 'all') {
				await createAllMutation.mutateAsync({ warehouse_ids: [item.id], text: text.trim() || undefined });
			} else {
				await createMutation.mutateAsync({
					client_ids: clientIds.map(Number),
					warehouse_ids: [item.id],
					text: text.trim() || undefined,
				});
			}
			notify({ title: 'Mahsulot Telegram orqali yuborish boshlandi' });
			setOpen(false);
		} catch {
			setFormError('Yuborishda xatolik yuz berdi');
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Telegramga yuborish</ModalTitle>
				</ModalHeader>
				<form onSubmit={handleSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}

						<div className='mb-3 rounded-[3px] bg-ca-silver p-3 text-xs text-ca-heading'>
							<span className='text-ca-text'>Mahsulot: </span>
							<span className='font-semibold'>{productLabel}</span>
						</div>

						<FormField label='Kimlarga yuborilsin' horizontal={false} className='mb-3'>
							<RadioGroup
								name='telegram-target'
								value={target}
								onChange={(v) => setTarget(v as 'all' | 'selected')}
								inline
								options={[
									{ value: 'all', label: 'Barcha mijozlarga' },
									{ value: 'selected', label: 'Tanlangan mijozlarga' },
								]}
							/>
						</FormField>

						{target === 'all' ? (
							<div className='mb-3 flex min-h-[34px] items-center gap-2 rounded-[3px] border border-[#ccd0d4] bg-ca-silver/40 px-2.5 py-1.5 text-xs text-ca-heading'>
								{loadingCount ? (
									<>
										<FaSpinner className='animate-spin' /> Yuklanmoqda...
									</>
								) : (
									<>
										Botga ulangan mijozlar: <span className='font-semibold'>{allClientsCount ?? 0} ta</span>
									</>
								)}
							</div>
						) : (
							<FormField label='Mijozlar' required horizontal={false} className='mb-3'>
								<MultiCombobox
									value={clientIds}
									onChange={setClientIds}
									loadOptions={loadClientOptions}
									placeholder='Mijozlarni tanlang'
								/>
							</FormField>
						)}

						<FormField label="Qo'shimcha matn" horizontal={false} className='mb-0'>
							<Textarea
								rows={3}
								value={text}
								onChange={(e) => setText(e.target.value)}
								placeholder='Ixtiyoriy'
							/>
						</FormField>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='theme' disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<FaSpinner className='mr-2 animate-spin' /> Yuborilmoqda...
								</>
							) : (
								'Yuborish'
							)}
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}

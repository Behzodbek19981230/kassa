import { useState } from 'react';
import { FaCopy, FaExclamationTriangle, FaQuestionCircle } from 'react-icons/fa';
import {
	AlertBlock,
	Button,
	Checkbox,
	Combobox,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	Tooltip,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { useRegisterTelegramBotMutation } from '@/services/user/user.queries';
import type { User } from '@/services/user/user.types';

interface TelegramBotRegisterModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: User;
}

const SEND_BOT_TYPE_OPTIONS = [
	{ value: 'admin', label: 'Admin' },
	{ value: 'manager', label: 'Manager' },
	{ value: 'sklad_manager', label: 'Sklad Manager' },
	{ value: 'employee', label: 'Hodim' },
];

const SEND_BOT_TYPE_DESCRIPTIONS: Record<string, string[]> = {
	admin: ['Buyurtma', "Qarz to'lovi", 'Import', 'Vozvrat', 'Login/block kabi admin xabarlari'],
	manager: ['Buyurtma', 'Vozvrat'],
	sklad_manager: ["Import bo'yicha xabarlar"],
	employee: ["Faqat o'zi qilgan buyurtma", "O'ziga tegishli qarz to'lovi"],
};

export default function TelegramBotRegisterModal({ open, setOpen, item }: TelegramBotRegisterModalProps) {
	const { notify } = useNotification();
	const [sendBotType, setSendBotType] = useState(item.send_bot_type ?? SEND_BOT_TYPE_OPTIONS[0].value);
	const [isSendBot, setIsSendBot] = useState(item.is_send_bot ?? true);
	const [copied, setCopied] = useState(false);
	const registerMutation = useRegisterTelegramBotMutation();

	async function handleCopy() {
		if (!item.telegram_connect_code) return;
		await navigator.clipboard.writeText(item.telegram_connect_code);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}

	async function handleSave() {
		try {
			await registerMutation.mutateAsync({
				id: item.id,
				payload: { send_bot_type: sendBotType, is_send_bot: isSendBot },
			});
			notify({ title: "Hodim Telegram bot uchun ro'yxatga olindi" });
			setOpen(false);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, 'Xatolik yuz berdi') });
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-lg'>
				<ModalHeader>
					<ModalTitle>Hodimni Telegram Botdan ro'yxatdan o'tkazish</ModalTitle>
				</ModalHeader>
				<ModalBody className='space-y-3'>
					<AlertBlock variant='danger' title='Eslatma' icon={<FaExclamationTriangle />}>
						Admin tomonidan Telegram botga kirilib{' '}
						<span className='font-semibold'>/connect {item.telegram_connect_code ?? 'KOD'}</span> yozilib
						Enter bosiladi. Shunda "Telegram akkauntingiz user profilingizga ulandi" ga o'xshash xabar
						olinadi. Shundan so'ng hodimning telegramiga xabarnoma boradi.
					</AlertBlock>

					<Checkbox
						className='my-2'
						id='is_send_bot'
						label='Bot orqali xabarnoma olsinmi?'
						checked={isSendBot}
						onCheckedChange={setIsSendBot}
					/>
					<div>
						<div className='mb-1 flex items-center gap-1.5'>
							<label className='block text-xs font-semibold text-ca-heading'>Send bot turi</label>
							<Tooltip
								side='bottom'
								contentClassName='w-72 max-w-[80vw] whitespace-normal text-left'
								content={
									<div className='space-y-1.5'>
										<p className='font-semibold'>Bot hodim turiga qarab xabar yuboradi:</p>
										<ul className='space-y-1'>
											{SEND_BOT_TYPE_OPTIONS.map((option) => (
												<li key={option.value}>
													<span className='font-semibold'>{option.label}</span>
													<ul className='list-disc space-y-0.5 pl-4'>
														{SEND_BOT_TYPE_DESCRIPTIONS[option.value].map((description) => (
															<li key={description}>{description}</li>
														))}
													</ul>
												</li>
											))}
										</ul>
									</div>
								}
							>
								<button
									type='button'
									onClick={(e) => e.currentTarget.focus()}
									className='flex items-center text-ca-text hover:text-ca-heading'
									aria-label="Ma'lumot"
								>
									<FaQuestionCircle />
								</button>
							</Tooltip>
						</div>
						<Combobox
							value={sendBotType}
							onChange={setSendBotType}
							options={SEND_BOT_TYPE_OPTIONS}
							selectedLabel={SEND_BOT_TYPE_OPTIONS.find((o) => o.value === sendBotType)?.label}
						/>
					</div>

					<div>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>
							Telegram ulanish kodi
						</label>
						<div className='flex gap-2'>
							<Input value={item.telegram_connect_code ?? ''} disabled />
							<Button
								type='button'
								variant='white'
								size='icon'
								aria-label='Nusxalash'
								onClick={handleCopy}
								disabled={!item.telegram_connect_code}
							>
								<FaCopy />
							</Button>
						</div>
						{copied && <p className='mt-1 text-[11px] text-ca-green'>Nusxalandi</p>}
					</div>

					<div>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Telegram ID</label>
						<Input value={item.telegram_id != null ? String(item.telegram_id) : ''} disabled />
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button variant='theme' onClick={handleSave} disabled={registerMutation.isPending}>
						Saqlash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

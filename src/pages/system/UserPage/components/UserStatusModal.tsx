import { useState } from 'react';
import type { ButtonProps } from '@/components/ui/Button';
import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import {
	useArchiveUserMutation,
	useDeleteUserMutation,
	useRestoreUserMutation,
} from '@/services/user/user.queries';
import { isSystemUser, userFullName, type User } from '@/services/user/user.types';

export type UserStatusAction = 'archive' | 'restore' | 'delete';

const ACTIONS: Record<
	UserStatusAction,
	{
		title: string;
		question: (name: string) => string;
		note: (user: User) => string | null;
		confirm: string;
		variant: ButtonProps['variant'];
		success: string;
		failure: string;
	}
> = {
	archive: {
		title: "Arxivga o'tkazish",
		question: (name) => `"${name}" arxivga o'tkazilsinmi?`,
		note: (user) =>
			isSystemUser(user)
				? "Foydalanuvchining sessiyasi yopiladi va u tizimga kira olmaydi. Arxivdan faqat Super Admin tiklay oladi."
				: 'Arxivdan faqat Super Admin tiklay oladi.',
		confirm: "Arxivga o'tkazish",
		variant: 'warning',
		success: "Hodim arxivga o'tkazildi",
		failure: "Arxivga o'tkazishda xatolik yuz berdi",
	},
	restore: {
		title: 'Arxivdan tiklash',
		question: (name) => `"${name}" arxivdan tiklansinmi?`,
		note: () => "Hodim o'z tabiga qaytadi.",
		confirm: 'Tiklash',
		variant: 'success',
		success: 'Hodim arxivdan tiklandi',
		failure: 'Tiklashda xatolik yuz berdi',
	},
	delete: {
		title: "Butunlay o'chirish",
		question: (name) => `"${name}" bazadan butunlay o'chirilsinmi?`,
		note: () =>
			"Bu amalni qaytarib bo'lmaydi. Oylik to'lovi bor hodim o'chirilmaydi va arxivda qoladi.",
		confirm: "O'chirish",
		variant: 'danger',
		success: "Hodim o'chirildi",
		failure: "O'chirishda xatolik yuz berdi",
	},
};

interface UserStatusModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: User;
	action: UserStatusAction;
}

/** Confirms archiving an active user, or restoring / permanently deleting an archived one. */
export default function UserStatusModal({ open, setOpen, item, action }: UserStatusModalProps) {
	const { notify } = useNotification();
	const [error, setError] = useState('');
	const archiveMutation = useArchiveUserMutation();
	const restoreMutation = useRestoreUserMutation();
	const deleteMutation = useDeleteUserMutation();
	const mutation = { archive: archiveMutation, restore: restoreMutation, delete: deleteMutation }[action];
	const config = ACTIONS[action];
	const note = config.note(item);

	const handleConfirm = async () => {
		setError('');
		try {
			await mutation.mutateAsync(item.id);
			notify({ title: config.success });
			setOpen(false);
		} catch (err) {
			// e.g. 409 on delete: the employee has payroll payments, so they stay in the archive.
			setError(getApiErrorMessage(err, config.failure));
		}
	};

	return (
		<Modal open={open} onOpenChange={(next) => !mutation.isPending && setOpen(next)}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{config.title}</ModalTitle>
				</ModalHeader>
				<ModalBody className='space-y-2'>
					{error && (
						<div className='rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
							{error}
						</div>
					)}
					<p>{config.question(userFullName(item))}</p>
					{note && <p className='text-xs text-ca-text'>{note}</p>}
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)} disabled={mutation.isPending}>
						Bekor qilish
					</Button>
					<Button variant={config.variant} onClick={handleConfirm} loading={mutation.isPending}>
						{config.confirm}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

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
import { useUnblockUserMutation } from '@/services/user/user.queries';
import type { User } from '@/services/user/user.types';

interface UnblockUserModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: User;
}

export default function UnblockUserModal({ open, setOpen, item }: UnblockUserModalProps) {
	const { notify } = useNotification();
	const unblockMutation = useUnblockUserMutation();

	async function handleUnblock() {
		try {
			await unblockMutation.mutateAsync(item.id);
			notify({ title: 'Foydalanuvchi blokdan chiqarildi' });
			setOpen(false);
		} catch (err) {
			notify({ title: getApiErrorMessage(err, 'Blokdan chiqarishda xatolik yuz berdi') });
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Blokdan chiqarishni tasdiqlang</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p className='mb-3'>
						Ushbu foydalanuvchini blokdan chiqarmoqchimisiz?
					</p>
					<div className='space-y-1 text-xs'>
						<p>
							<span className='font-semibold text-ca-heading'>Hodim:</span>{' '}
							{`${item.last_name} ${item.first_name}`.trim() || item.username}
						</p>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button variant='danger' onClick={handleUnblock} disabled={unblockMutation.isPending}>
						Blokdan chiqarish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

import { getApiErrorMessage } from '@/lib/errors';
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
import { useUpdateClientStatusMutation } from '@/services/client/client.queries';
import type { Client } from '@/services/client/client.types';

interface ConfirmClientModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: Client;
}

export default function ConfirmClientModal({ open, setOpen, item }: ConfirmClientModalProps) {
	const { notify } = useNotification();
	const updateStatusMutation = useUpdateClientStatusMutation();

	const handleConfirm = async () => {
		try {
			await updateStatusMutation.mutateAsync({ id: item.id, status: 'confirmed_telegram' });
			notify({ title: 'Mijoz tasdiqlandi' });
			setOpen(false);
		} catch (err) {
			notify({ title: 'Xatolik', text: getApiErrorMessage(err, 'Tasdiqlashda xatolik yuz berdi') });
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Mijozni tasdiqlash</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p>
						Haqiqatdan ham <span className='font-semibold'>"{item.fio}"</span> mijozini mahsulotlarni
						ko'rishiga ruxsat berasizmi?
					</p>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button variant='success' onClick={handleConfirm} disabled={updateStatusMutation.isPending}>
						Ha, tasdiqlash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

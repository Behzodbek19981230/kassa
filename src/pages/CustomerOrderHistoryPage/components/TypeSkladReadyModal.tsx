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
import { cn } from '@/lib/utils';
import { useMarkTypeSkladReadyMutation } from '@/services/order-account-history/order-account-history.queries';
import type { OrderTypeSkladStatusPart } from '@/services/order-account-history/order-account-history.types';

interface TypeSkladReadyModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	orderId: number;
	parts: OrderTypeSkladStatusPart[];
}

/** Marks the order ready per TypeSklad ("Sklad", "Do'kon", ...), each one separately. */
export default function TypeSkladReadyModal({ open, setOpen, orderId, parts }: TypeSkladReadyModalProps) {
	const { notify } = useNotification();
	const readyMutation = useMarkTypeSkladReadyMutation();

	async function handleReady(part: OrderTypeSkladStatusPart) {
		try {
			await readyMutation.mutateAsync({ orderId, part });
		} catch (err) {
			notify({ title: getApiErrorMessage(err, 'Xatolik yuz berdi') });
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Tayyorlanganini tasdiqlash</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<div className='flex flex-col gap-2'>
						{parts.map((part) => {
							const isPending =
								readyMutation.isPending &&
								readyMutation.variables?.orderId === orderId &&
								readyMutation.variables?.part.type_sklad === part.type_sklad;
							return (
								<div
									key={part.type_sklad}
									className='flex items-center justify-between gap-3 rounded-[3px] bg-ca-silver px-3 py-2'
								>
									<div className='text-xs'>
										<span className='font-semibold text-ca-heading'>{part.type_sklad_name}: </span>
										<span className={cn('font-semibold', part.color === 'green' ? 'text-ca-green' : 'text-ca-red')}>
											{part.text}
										</span>
									</div>
									{part.can_mark_ready && part.status_key === 'in_progress' && (
										<Button
											type='button'
											variant='success'
											size='xs'
											disabled={isPending}
											onClick={() => handleReady(part)}
										>
											{isPending ? 'Saqlanmoqda...' : 'Tayyorlandi'}
										</Button>
									)}
								</div>
							);
						})}
					</div>
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

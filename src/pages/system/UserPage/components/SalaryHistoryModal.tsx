import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui';
import SalaryHistoryTable from '@/pages/system/UserPayrollPage/SalaryHistoryTable';
import { fmtDollar, fmtSom } from '@/pages/system/UserPayrollPage/utils';
import type { User } from '@/services/user/user.types';

interface SalaryHistoryModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: User;
}

/** Opened from the users table's "Ish haqi" cell: the current salary and its change history. */
export default function SalaryHistoryModal({ open, setOpen, item }: SalaryHistoryModalProps) {
	const name = `${item.last_name} ${item.first_name}`.trim() || item.username;
	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-[720px]'>
				<ModalHeader>
					<ModalTitle>Ish haqi tarixi — {name}</ModalTitle>
				</ModalHeader>
				<ModalBody className='space-y-3'>
					<div className='text-sm text-ca-heading'>
						Joriy oylik:{' '}
						<b>
							{fmtDollar(item.oylik_dollar)} / {fmtSom(item.oylik_som)}
						</b>
					</div>
					<SalaryHistoryTable userId={item.id} enabled={open} />
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

import { useEffect, useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/ui';
import SalaryPaymentForm from '@/pages/PayrollPage/SalaryPaymentForm';
import type { YearMonth } from '@/pages/PayrollPage/shared/utils';

interface SalaryPaymentModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	/** Month the payment is for when the modal opens. */
	initialYm: YearMonth;
	/** Preselected employee, e.g. from the employee's own page. */
	initialUserId?: number;
}

/** "Pul berish" in a modal: the same form as the /payroll/pay page. */
export default function SalaryPaymentModal({ open, setOpen, initialYm, initialUserId }: SalaryPaymentModalProps) {
	const [userId, setUserId] = useState<number | undefined>(initialUserId);
	const [ym, setYm] = useState<YearMonth>(initialYm);

	// Start from the caller's employee and month every time the modal opens.
	useEffect(() => {
		if (open) {
			setUserId(initialUserId);
			setYm(initialYm);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-[1100px] rounded-xl'>
				<ModalHeader className='px-5 py-4'>
					<ModalTitle className='flex items-center gap-3 text-xl font-bold'>
						<span className='h-7 w-1.5 rounded-full bg-emerald-600' />
						Pul berish
					</ModalTitle>
				</ModalHeader>
				<ModalBody className='bg-ca-body p-5'>
					{open && (
						<SalaryPaymentForm
							userId={userId}
							onUserChange={setUserId}
							ym={ym}
							onYmChange={setYm}
							onCancel={() => setOpen(false)}
							onSaved={() => setOpen(false)}
							compact
						/>
					)}
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui';
import type { BrandSizeType } from '@/services/brand-size-type/brand-size-type.types';

interface TypeViewModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: BrandSizeType;
}

export default function TypeViewModal({ open, setOpen, item }: TypeViewModalProps) {
	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Tur ma'lumotlari</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<dl className='space-y-2 text-xs'>
						<div className='flex justify-between'>
							<dt className='text-ca-text'>Nomi</dt>
							<dd className='font-medium text-ca-heading'>{item.name}</dd>
						</div>
						<div className='flex justify-between'>
							<dt className='text-ca-text'>Tartibi</dt>
							<dd className='font-medium text-ca-heading'>{item.sorting}</dd>
						</div>
						<div className='flex justify-between'>
							<dt className='text-ca-text'>Holati</dt>
							<dd className='font-medium text-ca-heading'>{item.status ? 'Faol' : 'Nofaol'}</dd>
						</div>
						<div className='flex justify-between'>
							<dt className='text-ca-text'>Yaratilgan</dt>
							<dd className='font-medium text-ca-heading'>
								{new Date(item.created_time).toLocaleString()}
							</dd>
						</div>
					</dl>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
						Yopish
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui';
import { useBrandListQuery } from '@/services/brand/brand.queries';
import type { ProductCategory } from '@/services/product-category/product-category.types';

interface CategoryViewModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: ProductCategory;
}

export default function CategoryViewModal({ open, setOpen, item }: CategoryViewModalProps) {
	const { data: brandData } = useBrandListQuery({ limit: 100 });
	const brandNameById = new Map((brandData?.results ?? []).map((b) => [b.id, b.name]));

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Toifa ma'lumotlari</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<dl className='space-y-2 text-xs'>
						<div className='flex justify-between'>
							<dt className='text-ca-text'>Nomi</dt>
							<dd className='font-medium text-ca-heading'>{item.name}</dd>
						</div>
						<div className='flex justify-between'>
							<dt className='text-ca-text'>Model</dt>
							<dd className='font-medium text-ca-heading'>{brandNameById.get(item.brand) ?? item.brand}</dd>
						</div>
						<div className='flex justify-between'>
							<dt className='text-ca-text'>Tartibi</dt>
							<dd className='font-medium text-ca-heading'>{item.sorting}</dd>
						</div>
						<div className='flex justify-between'>
							<dt className='text-ca-text'>Holati</dt>
							<dd className='font-medium text-ca-heading'>{item.status === 1 ? 'Faol' : 'Nofaol'}</dd>
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

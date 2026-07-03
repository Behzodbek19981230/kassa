import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui';
import type { BrandSize } from '@/services/brand-size/brand-size.types';
import { useBrandSizeTypeListQuery } from '@/services/brand-size-type/brand-size-type.queries';
import { useBrandListQuery } from '@/services/brand/brand.queries';
import { useProductCategoryListQuery } from '@/services/product-category/product-category.queries';

interface SizeViewModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	item: BrandSize;
}

export default function SizeViewModal({ open, setOpen, item }: SizeViewModalProps) {
	const { data: brandData } = useBrandListQuery({ limit: 100 });
	const brandNameById = new Map((brandData?.results ?? []).map((b) => [b.id, b.name]));

	const { data: categoryData } = useProductCategoryListQuery({ limit: 100 });
	const categoryNameById = new Map((categoryData?.results ?? []).map((c) => [c.id, c.name]));

	const { data: typeData } = useBrandSizeTypeListQuery({ limit: 100 });
	const typeNameById = new Map((typeData?.results ?? []).map((t) => [t.id, t.name]));

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>O'lcham ma'lumotlari</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<dl className='space-y-2 text-xs'>
						<div className='flex justify-between'>
							<dt className='text-ca-text'>Model</dt>
							<dd className='font-medium text-ca-heading'>{brandNameById.get(item.brand) ?? item.brand}</dd>
						</div>
						<div className='flex justify-between'>
							<dt className='text-ca-text'>Mahsulot toifasi</dt>
							<dd className='font-medium text-ca-heading'>
								{categoryNameById.get(item.product_category) ?? item.product_category}
							</dd>
						</div>
						<div className='flex justify-between'>
							<dt className='text-ca-text'>Turi</dt>
							<dd className='font-medium text-ca-heading'>{typeNameById.get(item.type) ?? item.type}</dd>
						</div>
						<div className='flex justify-between'>
							<dt className='text-ca-text'>O'lchami</dt>
							<dd className='font-medium text-ca-heading'>{item.size}</dd>
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

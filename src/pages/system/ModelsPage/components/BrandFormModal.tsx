import { useEffect, useState } from 'react';
import {
	Button,
	Checkbox,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	useNotification,
} from '@/components/ui';
import { useCreateBrandMutation, useUpdateBrandMutation } from '@/services/brand/brand.queries';
import { brandService } from '@/services/brand/brand.service';
import type { Brand, BrandPayload } from '@/services/brand/brand.types';

interface BrandFormState {
	name: string;
	sorting: string;
	active: boolean;
}

interface BrandFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: Brand;
}

export default function BrandFormModal({ open, setOpen, mode, item }: BrandFormModalProps) {
	const { notify } = useNotification();
	const [form, setForm] = useState<BrandFormState>(
		mode === 'edit' && item
			? { name: item.name, sorting: String(item.sorting), active: item.status === 1 }
			: { name: '', sorting: '0', active: true },
	);
	const [formError, setFormError] = useState('');
	const [sortingHint, setSortingHint] = useState('');

	const createMutation = useCreateBrandMutation();
	const updateMutation = useUpdateBrandMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		brandService
			.getNextSorting()
			.then(({ first_empty_sorting, message }) => {
				setSortingHint(message);
				if (mode === 'create') setForm((f) => ({ ...f, sorting: String(first_empty_sorting) }));
			})
			.catch(() => {
				// keep default sorting if the suggestion request fails
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSubmit = async () => {
		if (!form.name.trim()) {
			setFormError('Nomi kiritilishi shart');
			return;
		}

		const payload: BrandPayload = {
			name: form.name.trim(),
			sorting: Number(form.sorting) || 0,
			status: form.active ? 1 : 0,
			sup_status: form.active ? 1 : 0,
		};

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: 'Model yangilandi' });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Model qo'shildi" });
			}
			setOpen(false);
		} catch {
			setFormError('Saqlashda xatolik yuz berdi');
		}
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{mode === 'edit' ? 'Modelni tahrirlash' : "Model qo'shish"}</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{formError && (
						<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}
					<div className='mb-3'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Nomi</label>
						<Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
					</div>
					<div className='mb-3'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Tartibi</label>
						<Input
							type='number'
							value={form.sorting}
							onChange={(e) => setForm((f) => ({ ...f, sorting: e.target.value }))}
						/>
						{sortingHint && <i className='mt-1 block text-xs text-ca-text'>{sortingHint}</i>}
					</div>
					<Checkbox
						inline
						label='Faol'
						checked={form.active}
						onCheckedChange={(v) => setForm((f) => ({ ...f, active: !!v }))}
					/>
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button variant='success' onClick={handleSubmit} disabled={isSaving}>
						Saqlash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

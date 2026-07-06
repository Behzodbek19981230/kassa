import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
	Button,
	FormField,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	useNotification,
} from '@/components/ui';
import { formatUzPhone, UZ_PHONE_REGEX } from '@/lib/phone';
import { useCreateAboutMutation, useUpdateAboutMutation } from '@/services/about/about.queries';
import type { About, AboutPayload } from '@/services/about/about.types';
import { useUserInfoQuery } from '@/services/user/user.queries';

const aboutFormSchema = z.object({
	nomer_nakladnoy: z.string().min(1, 'Nakladnoy raqami kiritilishi shart'),
	postavshik: z.string().min(1, 'Yetkazib beruvchi kiritilishi shart'),
	phone: z.string().regex(UZ_PHONE_REGEX, "Telefon raqami to'liq kiritilishi shart"),
	dostavshik: z.string().min(1, 'Dostavchik kiritilishi shart'),
	t_p: z.string().min(1, "t_p kiritilishi shart"),
});

type AboutFormValues = z.infer<typeof aboutFormSchema>;

interface AboutFormModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	item?: About;
}

export default function AboutFormModal({ open, setOpen, mode, item }: AboutFormModalProps) {
	const { notify } = useNotification();
	const [formError, setFormError] = useState('');
	const { data: userInfo } = useUserInfoQuery();

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<AboutFormValues>({
		resolver: zodResolver(aboutFormSchema),
		defaultValues:
			mode === 'edit' && item
				? {
						nomer_nakladnoy: item.nomer_nakladnoy,
						postavshik: item.postavshik,
						phone: item.phone,
						dostavshik: item.dostavshik,
						t_p: item.t_p,
					}
				: {
						nomer_nakladnoy: '',
						postavshik: '',
						phone: '+998',
						dostavshik: '',
						t_p: '',
					},
	});

	const createMutation = useCreateAboutMutation();
	const updateMutation = useUpdateAboutMutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const onSubmit = handleSubmit(async (values) => {
		setFormError('');
		const company = item?.company ?? userInfo?.companies?.[0];
		if (!company) {
			setFormError('Tashkilot topilmadi');
			return;
		}

		const payload: AboutPayload = {
			nomer_nakladnoy: values.nomer_nakladnoy.trim(),
			postavshik: values.postavshik.trim(),
			phone: values.phone.trim(),
			dostavshik: values.dostavshik.trim(),
			t_p: values.t_p.trim(),
			company,
		};

		try {
			if (mode === 'edit' && item) {
				await updateMutation.mutateAsync({ id: item.id, payload });
				notify({ title: "Ma'lumot yangilandi" });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Ma'lumot qo'shildi" });
			}
			setOpen(false);
		} catch {
			setFormError('Saqlashda xatolik yuz berdi');
		}
	});

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{mode === 'edit' ? "Ma'lumotni tahrirlash" : "Ma'lumot qo'shish"}</ModalTitle>
				</ModalHeader>
				<form onSubmit={onSubmit} noValidate>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<FormField
							label='Nakladnoy raqami'
							error={errors.nomer_nakladnoy?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Input {...register('nomer_nakladnoy')} />
						</FormField>
						<FormField
							label='Yetkazib beruvchi'
							error={errors.postavshik?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Input {...register('postavshik')} />
						</FormField>
						<FormField label='Telefon' error={errors.phone?.message} required horizontal={false} className='mb-3'>
							<Controller
								name='phone'
								control={control}
								render={({ field }) => (
									<Input
										inputMode='numeric'
										placeholder='+998 XX XXX XX XX'
										value={field.value}
										onChange={(e) => field.onChange(formatUzPhone(e.target.value))}
										onBlur={field.onBlur}
									/>
								)}
							/>
						</FormField>
						<FormField
							label='Dostavchik'
							error={errors.dostavshik?.message}
							required
							horizontal={false}
							className='mb-3'
						>
							<Input {...register('dostavshik')} />
						</FormField>
						<FormField label='t_p' error={errors.t_p?.message} required horizontal={false} className='mb-3'>
							<Input {...register('t_p')} />
						</FormField>
					</ModalBody>
					<ModalFooter>
						<Button type='button' variant='white' onClick={() => setOpen(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' variant='success' disabled={isSaving}>
							Saqlash
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
}

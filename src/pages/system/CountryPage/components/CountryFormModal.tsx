import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { getApiErrorMessage } from '@/lib/errors';
import { useCreateCountryMutation, useUpdateCountryMutation } from '@/services/country/country.queries';
import type { Country, CountryPayload } from '@/services/country/country.types';

const countryFormSchema = z.object({
   name: z.string().trim().min(1, 'Nomi kiritilishi shart'),
});

type CountryFormValues = z.infer<typeof countryFormSchema>;

interface CountryFormModalProps {
   open: boolean;
   setOpen: (open: boolean) => void;
   mode: 'create' | 'edit';
   item?: Country;
}

export default function CountryFormModal({ open, setOpen, mode, item }: CountryFormModalProps) {
   const { notify } = useNotification();
   const [formError, setFormError] = useState('');

   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<CountryFormValues>({
      resolver: zodResolver(countryFormSchema),
      defaultValues: { name: mode === 'edit' && item ? item.name : '' },
   });

   const createMutation = useCreateCountryMutation();
   const updateMutation = useUpdateCountryMutation();
   const isSaving = createMutation.isPending || updateMutation.isPending;

   const onSubmit = handleSubmit(async (values) => {
      setFormError('');
      const payload: CountryPayload = { name: values.name.trim(), code: values.name.trim().toUpperCase().slice(0, 3) }; // Example code generation logic

      try {
         if (mode === 'edit' && item) {
            await updateMutation.mutateAsync({ id: item.id, payload });
            notify({ title: 'Davlat yangilandi' });
         } else {
            await createMutation.mutateAsync(payload);
            notify({ title: "Davlat qo'shildi" });
         }
         setOpen(false);
      } catch (err) {
         setFormError(getApiErrorMessage(err, 'Saqlashda xatolik yuz berdi'));
      }
   });

   return (
      <Modal open={open} onOpenChange={setOpen}>
         <ModalContent>
            <ModalHeader>
               <ModalTitle>{mode === 'edit' ? 'Davlatni tahrirlash' : "Davlat qo'shish"}</ModalTitle>
            </ModalHeader>
            <form onSubmit={onSubmit} noValidate>
               <ModalBody>
                  {formError && (
                     <div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
                        {formError}
                     </div>
                  )}
                  <FormField label='Nomi' error={errors.name?.message} required horizontal={false} className='mb-3'>
                     <Input {...register('name')} placeholder="Masalan: Qozog'iston" />
                  </FormField>
               </ModalBody>
               <ModalFooter>
                  <Button type='button' variant='white' onClick={() => setOpen(false)}>
                     Bekor qilish
                  </Button>
                  <Button type='submit' variant='success' loading={isSaving}>
                     Saqlash
                  </Button>
               </ModalFooter>
            </form>
         </ModalContent>
      </Modal>
   );
}

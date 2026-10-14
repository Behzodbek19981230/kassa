import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaTruck } from 'react-icons/fa';
import { z } from 'zod';
import {
   Button,
   Combobox,
   DatePicker,
   FormField,
   InputGroup,
   Modal,
   ModalBody,
   ModalContent,
   ModalHeader,
   ModalTitle,
   PriceInput,
   useNotification,
} from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { getApiErrorMessage } from '@/lib/errors';
import { useLogisticsCompanyQuery } from '@/services/logistics-company/logistics-company.queries';
import { useUzbekistanDispatchMutation } from '@/services/two-stage-import/two-stage-import.queries';
import { twoStageImportService } from '@/services/two-stage-import/two-stage-import.service';
import { loadLogisticsCompanyOptions } from '@/pages/TwoStageImport/options';
import { fromApiDateTime, nonNegativeNumber, nowTashkentLocal, positiveNumber, toApiDateTime } from '@/pages/TwoStageImport/utils';
import YuanRateHint from '@/pages/TwoStageImport/components/YuanRateHint';
import { useYuanDollarConversion } from '@/pages/TwoStageImport/useYuanDollarConversion';

const uzbekistanDispatchSchema = z.object({
   weightKg: positiveNumber("Og'irlikni kiriting"),
   volumeM3: positiveNumber('Hajmni kiriting'),
   carrierLogistics: z.string().min(1, 'Tashuvchi logistikani tanlang'),
   servicePriceYuan: nonNegativeNumber('Xizmat narxini kiriting (¥)'),
   servicePriceDollar: nonNegativeNumber('Xizmat narxini kiriting ($)'),
   truckNumber: z.string().trim().min(1, 'Fura raqamini kiriting'),
   driverPhone: z.string().trim().min(1, 'Haydovchi telefonini kiriting'),
   /** "YYYY-MM-DDTHH:mm" (Tashkent). */
   dispatchDatetime: z.string().min(1, "Jo'natish sanasini tanlang"),
});

type UzbekistanDispatchFormValues = z.infer<typeof uzbekistanDispatchSchema>;

interface UzbekistanDispatchFormProps {
   open: boolean;
   setOpen: (open: boolean) => void;
   cartId?: number;
   /** The cart's current dispatch time (API format); the date picked here is saved back to the cart. */
   cartDispatchDatetime?: string;
   consignor?: number;
   /** Receiving sklad of the cart being dispatched — chosen on the cart panel, so it's not asked here. */
   destinationTypeSklad?: number;
   disabled?: boolean;
}

export default function UzbekistanDispatchForm({
   open,
   setOpen,
   cartId,
   cartDispatchDatetime,
   consignor,
   destinationTypeSklad,
   disabled,
}: UzbekistanDispatchFormProps) {
   const initialDispatch = cartDispatchDatetime ? fromApiDateTime(cartDispatchDatetime) : nowTashkentLocal();
   const { notify } = useNotification();
   const [formError, setFormError] = useState('');

   const { yuanToDollar, dollarToYuan } = useYuanDollarConversion();
   const {
      control,
      setValue,
      register,
      handleSubmit,
      reset,
      watch,
      formState: { errors },
   } = useForm<UzbekistanDispatchFormValues>({
      resolver: zodResolver(uzbekistanDispatchSchema),
      defaultValues: {
         weightKg: '',
         volumeM3: '',
         carrierLogistics: '',
         servicePriceYuan: '',
         servicePriceDollar: '',
         truckNumber: '',
         driverPhone: '',
         dispatchDatetime: initialDispatch,
      },
   });

   const carrierId = watch('carrierLogistics');
   const { data: selectedCarrier } = useLogisticsCompanyQuery(carrierId ? Number(carrierId) : undefined);

   const dispatchMutation = useUzbekistanDispatchMutation();

   const onSubmit = handleSubmit(async (values) => {
      setFormError('');
      if (!cartId) {
         setFormError("Savat bo'sh. Avval mahsulot qo'shing.");
         return;
      }
      if (!consignor) {
         setFormError("Yuk jo'natuvchi tanlanmagan");
         return;
      }
      if (!destinationTypeSklad) {
         setFormError('Qabul qiluvchi sklad tanlanmagan');
         return;
      }

      try {
         // The dispatch date lives on the cart (uzbekistan-dispatch takes none), so a changed date is saved there first.
         if (values.dispatchDatetime !== initialDispatch) {
            await twoStageImportService.updateCartDispatchDatetime(cartId, toApiDateTime(values.dispatchDatetime));
         }
         const result = await dispatchMutation.mutateAsync({
            cart: cartId,
            consignor,
            carrier_logistics: Number(values.carrierLogistics),
            destination_type_sklad: destinationTypeSklad,
            truck_number: values.truckNumber.trim(),
            driver_phone: values.driverPhone.trim(),
            weight_kg: Number(values.weightKg).toFixed(3),
            volume_m3: Number(values.volumeM3).toFixed(4),
            service_price_yuan: Number(values.servicePriceYuan).toFixed(2),
            service_price_dollar: Number(values.servicePriceDollar).toFixed(2),
         });
         notify({ title: "O'zbekistonga jo'natildi", text: result.order_number });
         reset();
         setOpen(false);
      } catch (err) {
         setFormError(getApiErrorMessage(err, 'Tasdiqlashda xatolik yuz berdi'));
      }
   });

   return (
      <Modal open={open} onOpenChange={setOpen}>
         <ModalContent className='max-w-2xl'>
            <ModalHeader>
               <ModalTitle>O'zbekistonga yuk chiqarish</ModalTitle>
            </ModalHeader>
            <ModalBody>
               <form onSubmit={onSubmit} noValidate>
                  {formError && (
                     <div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
                        {formError}
                     </div>
                  )}

                  <div className='grid grid-cols-2 gap-x-4'>
                     <FormField label="Og'irlik (kg)" error={errors.weightKg?.message} required horizontal={false} className='mb-3'>
                        <Input type='number' inputMode='decimal' min={0} step='0.001' {...register('weightKg')} />
                     </FormField>
                     <FormField label='Hajm (m³)' error={errors.volumeM3?.message} required horizontal={false} className='mb-3'>
                        <Input type='number' inputMode='decimal' min={0} step='0.0001' {...register('volumeM3')} />
                     </FormField>

                     <div className='col-span-2'>
                        <FormField
                           label='Tashuvchi logistika'
                           error={errors.carrierLogistics?.message}
                           required
                           horizontal={false}
                           className='mb-3'
                        >
                           <Controller
                              name='carrierLogistics'
                              control={control}
                              render={({ field }) => (
                                 <Combobox
                                    value={field.value}
                                    onChange={(v) => field.onChange(v)}
                                    loadOptions={loadLogisticsCompanyOptions}
                                    selectedLabel={selectedCarrier?.name}
                                    placeholder='Tashuvchini tanlang'
                                 />
                              )}
                           />
                        </FormField>
                     </div>

                     <FormField label='Xizmat narxi (¥)' error={errors.servicePriceYuan?.message} required horizontal={false} className='mb-3'>
                        <Controller
                           name='servicePriceYuan'
                           control={control}
                           render={({ field }) => (
                              <InputGroup prepend='¥'>
                                 <PriceInput
                                    value={field.value}
                                    onChange={(value) => {
                                       field.onChange(value);
                                       const converted = yuanToDollar(value);
                                       if (converted !== null) setValue('servicePriceDollar', converted, { shouldValidate: converted !== '' });
                                    }}
                                    onBlur={field.onBlur}
                                 />
                              </InputGroup>
                           )}
                        />
                        <YuanRateHint />
                     </FormField>
                     <FormField label='Xizmat narxi ($)' error={errors.servicePriceDollar?.message} required horizontal={false} className='mb-3'>
                        <Controller
                           name='servicePriceDollar'
                           control={control}
                           render={({ field }) => (
                              <InputGroup prepend='$'>
                                 <PriceInput
                                    value={field.value}
                                    onChange={(value) => {
                                       field.onChange(value);
                                       const converted = dollarToYuan(value);
                                       if (converted !== null) setValue('servicePriceYuan', converted, { shouldValidate: converted !== '' });
                                    }}
                                    onBlur={field.onBlur}
                                 />
                              </InputGroup>
                           )}
                        />
                     </FormField>

                     <FormField label='Fura raqami' error={errors.truckNumber?.message} required horizontal={false} className='mb-3'>
                        <Input {...register('truckNumber')} />
                     </FormField>
                     <FormField label='Haydovchi telefoni' error={errors.driverPhone?.message} required horizontal={false} className='mb-3'>
                        <Input {...register('driverPhone')} placeholder='+998901234567' />
                     </FormField>
                     <FormField
                        label="Jo'natish sanasi"
                        error={errors.dispatchDatetime?.message}
                        required
                        horizontal={false}
                        className='mb-3'
                     >
                        <Controller
                           name='dispatchDatetime'
                           control={control}
                           render={({ field }) => (
                              // Only the date is picked; the time stays as the cart's.
                              <DatePicker
                                 value={field.value}
                                 onChange={(date) => field.onChange(date ? `${date}T${field.value.slice(11, 16) || '00:00'}` : '')}
                              />
                           )}
                        />
                     </FormField>
                  </div>

                  <Button
                     type='submit'
                     variant='danger'
                     size='lg'
                     className='w-full'
                     disabled={disabled || !cartId}
                     loading={dispatchMutation.isPending}
                  >
                     <FaTruck className='mr-1.5' /> Buyurtmani tasdiqlash
                  </Button>
               </form>
            </ModalBody>
         </ModalContent>
      </Modal>
   );
}

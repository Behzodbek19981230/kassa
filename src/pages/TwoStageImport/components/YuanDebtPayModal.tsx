import { useState } from 'react';
import {
   Button,
   DatePicker,
   FormField,
   Input,
   InputGroup,
   Modal,
   ModalBody,
   ModalContent,
   ModalFooter,
   ModalHeader,
   ModalTitle,
   PriceInput,
   useNotification,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { usePayLogisticsDebtInYuanMutation } from '@/services/logistics-debt/logistics-debt.queries';
import { usePayMyDebtInYuanMutation } from '@/services/my-debt/my-debt.queries';
import YuanRateHint from '@/pages/TwoStageImport/components/YuanRateHint';
import { useYuanDollarConversion } from '@/pages/TwoStageImport/useYuanDollarConversion';
import { todayTashkent } from '@/pages/TwoStageImport/utils';

/** Whose debt is paid: a consignor (MyTotalDebt) or a logistics company (LogisticsDebt). */
export type YuanDebtTarget = { kind: 'consignor'; consignorId: number } | { kind: 'logistics'; logisticsCompanyId: number };

interface YuanDebtPayModalProps {
   open: boolean;
   setOpen: (open: boolean) => void;
   target: YuanDebtTarget;
   /** Name of the consignor / logistics company, for the title. */
   name?: string;
   /** Current debt in dollars (that's how the backend keeps both debts). */
   currentDebtDollar?: number;
}

/**
 * Pays a debt in yuan (`/my-total-debt/payment/` or `/logistics-debt/payment/`). The backend doesn't
 * convert currencies, so the dollar equivalent that reduces the debt is computed here from today's yuan rate.
 */
export default function YuanDebtPayModal({ open, setOpen, target, name, currentDebtDollar = 0 }: YuanDebtPayModalProps) {
   const { notify } = useNotification();
   const { yuanToDollar, dollarToYuan } = useYuanDollarConversion();
   const consignorPayMutation = usePayMyDebtInYuanMutation();
   const logisticsPayMutation = usePayLogisticsDebtInYuanMutation();
   const isPending = consignorPayMutation.isPending || logisticsPayMutation.isPending;

   const [paidYuan, setPaidYuan] = useState('');
   const [paidDollar, setPaidDollar] = useState('');
   const [discountDollar, setDiscountDollar] = useState('');
   const [date, setDate] = useState(todayTashkent);
   const [text, setText] = useState('');
   const [formError, setFormError] = useState('');

   const currentDebtYuan = dollarToYuan(String(currentDebtDollar));

   async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setFormError('');
      const yuan = Number(paidYuan) || 0;
      const dollar = Number(paidDollar) || 0;
      const discount = Number(discountDollar) || 0;
      if (!date) {
         setFormError('Sanani tanlang');
         return;
      }
      if (yuan <= 0 && discount <= 0) {
         setFormError("To'langan summa (¥) yoki chegirma kiritilishi shart");
         return;
      }
      if (yuan > 0 && dollar <= 0) {
         setFormError("Dollar ekvivalenti hisoblanmadi — bugungi yuan kursini kiriting yoki dollarni qo'lda yozing");
         return;
      }

      const amounts = {
         date,
         paid_yuan: yuan.toFixed(2),
         all_summ_dollar: dollar.toFixed(2),
         discount_amount: discount.toFixed(2),
      };
      try {
         let remainingDollar: string;
         if (target.kind === 'consignor') {
            const result = await consignorPayMutation.mutateAsync({
               ...amounts,
               consignor: target.consignorId,
               text: text.trim() || undefined,
            });
            remainingDollar = result.summary.my_total_debt;
         } else {
            const result = await logisticsPayMutation.mutateAsync({
               ...amounts,
               logistics_company: target.logisticsCompanyId,
               note: text.trim() || undefined,
            });
            remainingDollar = result.summary.logistics_debt;
         }
         const remainingYuan = dollarToYuan(String(Number(remainingDollar)));
         notify({
            title: "To'lov qabul qilindi",
            text: `Qolgan qarz: ${remainingYuan !== null ? `${formatNumber(remainingYuan, 2)} ¥ / ` : ''}${formatNumber(remainingDollar, 2)} $`,
         });
         setOpen(false);
      } catch (err) {
         setFormError(getApiErrorMessage(err, "To'lovda xatolik yuz berdi"));
      }
   }

   return (
      <Modal open={open} onOpenChange={setOpen}>
         <ModalContent>
            <ModalHeader>
               <ModalTitle>{name ? `${name} qarzini to'lash` : "Qarz to'lash"}</ModalTitle>
            </ModalHeader>
            <form onSubmit={handleSubmit} noValidate>
               <ModalBody>
                  {formError && (
                     <div className='mb-3 rounded border border-ca-danger-border bg-ca-danger-bg px-3 py-2 text-xs text-ca-red'>
                        {formError}
                     </div>
                  )}
                  <div className='mb-4 rounded border border-ca-theme/30 bg-ca-theme/5 px-4 py-2 text-center text-sm font-semibold text-ca-theme'>
                     Joriy qarz: {currentDebtYuan !== null ? `${formatNumber(currentDebtYuan, 2)} ¥` : '—'}
                     <span className='ml-1.5 text-xs font-normal text-ca-text'>({formatNumber(currentDebtDollar, 2)} $)</span>
                  </div>

                  <div className='mb-3 grid grid-cols-2 gap-3'>
                     <FormField label="To'langan summa (¥)" required horizontal={false} className='mb-0'>
                        <InputGroup prepend='¥'>
                           <PriceInput
                              value={paidYuan}
                              autoFocus
                              onChange={(v) => {
                                 setPaidYuan(v);
                                 const dollar = yuanToDollar(v);
                                 if (dollar !== null) setPaidDollar(dollar);
                              }}
                           />
                        </InputGroup>
                        <YuanRateHint />
                     </FormField>
                     <FormField label='Dollar ekvivalenti ($)' horizontal={false} className='mb-0'>
                        <InputGroup prepend='$'>
                           <PriceInput
                              value={paidDollar}
                              onChange={(v) => {
                                 setPaidDollar(v);
                                 const yuan = dollarToYuan(v);
                                 if (yuan !== null) setPaidYuan(yuan);
                              }}
                           />
                        </InputGroup>
                        <p className='mt-1 text-[11px] text-ca-text'>Qarz shu summaga kamayadi</p>
                     </FormField>
                  </div>
                  <div className='mb-3 grid grid-cols-2 gap-3'>
                     <FormField label='Chegirma ($)' horizontal={false} className='mb-0'>
                        <PriceInput value={discountDollar} onChange={setDiscountDollar} />
                     </FormField>
                     <FormField label='Sana' required horizontal={false} className='mb-0'>
                        <DatePicker value={date} onChange={setDate} />
                     </FormField>
                  </div>
                  <FormField label='Izoh' horizontal={false} className='mb-0'>
                     <Input value={text} onChange={(e) => setText(e.target.value)} />
                  </FormField>
               </ModalBody>
               <ModalFooter>
                  <Button type='button' variant='white' onClick={() => setOpen(false)}>
                     Bekor qilish
                  </Button>
                  <Button type='submit' variant='success' loading={isPending}>
                     To'lash
                  </Button>
               </ModalFooter>
            </form>
         </ModalContent>
      </Modal>
   );
}

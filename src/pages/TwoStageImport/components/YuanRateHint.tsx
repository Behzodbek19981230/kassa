import { useCurrentCompany } from '@/lib/company';

/** Shown under ¥ inputs: today's yuan rate, which the paired $ field is converted with. */
export default function YuanRateHint() {
   const { yuanExchangeRate } = useCurrentCompany();
   const dollarPerYuan = Number(yuanExchangeRate?.dollar_per_yuan ?? 0);

   if (!dollarPerYuan) {
      return <p className='mt-1 text-[13px] text-ca-red'>Bugungi yuan kursi belgilanmagan</p>;
   }
   return (
      <p className='mt-1 text-[13px] text-ca-text'>
         1 ¥ = <span className='font-semibold text-ca-heading'>{Number(dollarPerYuan.toFixed(2))} $</span>
      </p>
   );
}

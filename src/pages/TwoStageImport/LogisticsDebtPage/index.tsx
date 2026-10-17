import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@/components/ui';
import LogisticsDebtHistoryTab from '@/pages/TwoStageImport/LogisticsDebtPage/LogisticsDebtHistoryTab';
import LogisticsDebtTab from '@/pages/TwoStageImport/LogisticsDebtPage/LogisticsDebtTab';

export default function LogisticsDebtPage() {
   const [searchParams, setSearchParams] = useSearchParams();
   const activeTab = searchParams.get('tab') === 'history' ? 'history' : 'debts';

   return (
      <>

         <Tabs
            value={activeTab}
            onValueChange={(tab) => setSearchParams(tab === 'debts' ? {} : { tab })}
            items={[
               { value: 'debts', label: 'Logistika firmalariga qarzlarim', content: <LogisticsDebtTab /> },
               { value: 'history', label: 'Qarzlar tarixi', content: <LogisticsDebtHistoryTab /> },
            ]}
         />
      </>
   );
}

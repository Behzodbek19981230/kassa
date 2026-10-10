import type { ReactNode } from 'react';

interface InfoItemProps {
   icon: ReactNode;
   label: string;
   value: ReactNode;
}

export default function InfoItem({ icon, label, value }: InfoItemProps) {
   return (
      <div className='flex items-center gap-3 px-3 py-2'>
         <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ca-theme/10 text-ca-theme'>
            {icon}
         </div>
         <div className='min-w-0'>
            <div className='text-[11px] text-ca-text'>{label}</div>
            <div className='truncate text-sm font-semibold text-ca-heading'>{value || '—'}</div>
         </div>
      </div>
   );
}

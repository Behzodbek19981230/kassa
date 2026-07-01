import type { WidgetStatsProps } from '@/types'
import { FaArrowCircleRight } from 'react-icons/fa'
import { cn } from '@/lib/utils'

const colorMap = {
  green: 'bg-ca-green',
  blue: 'bg-ca-primary',
  purple: 'bg-ca-purple',
  red: 'bg-ca-red',
} as const

export function WidgetStats({ color, icon, title, value }: WidgetStatsProps) {
  return (
    <div className={cn('relative mb-5 overflow-hidden rounded-[3px] p-[15px] text-white', colorMap[color])}>
      <div className="absolute top-[15px] right-[15px] text-[42px] leading-[56px] opacity-20">
        {icon}
      </div>
      <div>
        <h4 className="m-[5px_0] text-xs text-white">{title}</h4>
        <p className="mb-0 text-2xl font-light">{value}</p>
      </div>
      <div className="-mx-[15px] -mb-[15px] mt-[15px] bg-black/40">
        <a
          href="#"
          className="block px-[15px] py-[7px] text-right font-light text-[#ddd] no-underline hover:bg-black/60 hover:text-white"
        >
          View Detail <FaArrowCircleRight className="ml-1 inline" />
        </a>
      </div>
    </div>
  )
}

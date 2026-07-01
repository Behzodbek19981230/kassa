import { cn } from '@/lib/utils'

interface BarChartProps {
  data: { label: string; value: number }[]
  height?: number
  className?: string
}

export function BarChart({ data, height = 300, className }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div
      className={cn(
        'flex items-end justify-between gap-2 border-b border-l border-ca-border px-2 pb-8 pt-4',
        className,
      )}
      style={{ height }}
    >
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full max-w-[40px] rounded-t bg-ca-theme/80 transition-all"
            style={{ height: `${(item.value / max) * (height - 60)}px` }}
          />
          <span className="text-[10px] text-ca-text">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

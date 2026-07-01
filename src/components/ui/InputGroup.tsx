import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InputGroupProps {
  prepend?: ReactNode
  append?: ReactNode
  children: ReactNode
  className?: string
}

export function InputGroup({ prepend, append, children, className }: InputGroupProps) {
  return (
    <div className={cn('flex w-full', className)}>
      {prepend && (
        <span className="flex items-center rounded-l-[3px] border border-r-0 border-[#ccd0d4] bg-[#e2e7eb] px-3 text-xs text-ca-heading">
          {prepend}
        </span>
      )}
      <div className="min-w-0 flex-1 [&_input]:rounded-none [&_input]:border-x-0 [&_select]:rounded-none">
        {children}
      </div>
      {append && (
        <span className="flex items-center rounded-r-[3px] border border-l-0 border-[#ccd0d4] bg-[#e2e7eb] px-3 text-xs text-ca-heading">
          {append}
        </span>
      )}
    </div>
  )
}

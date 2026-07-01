import type { ReactNode } from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { FaChevronDown } from 'react-icons/fa'
import { cn } from '@/lib/utils'

interface AccordionItem {
  value: string
  title: string
  content: ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  className?: string
}

export function Accordion({
  items,
  type = 'single',
  defaultValue,
  className,
}: AccordionProps) {
  return (
    <AccordionPrimitive.Root
      type={type}
      defaultValue={defaultValue as never}
      collapsible={type === 'single'}
      className={cn('space-y-0', className)}
    >
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.value}
          value={item.value}
          className="mb-0 overflow-hidden rounded-[3px] border border-ca-border bg-white"
        >
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between bg-ca-silver px-[15px] py-2.5 text-left text-xs font-semibold text-ca-heading hover:bg-ca-border/50">
              {item.title}
              <FaChevronDown className="text-[10px] transition-transform group-data-[state=open]:rotate-180" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden px-[15px] py-3 text-xs text-ca-text">
            {item.content}
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  )
}

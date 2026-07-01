import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'

interface TabsProps {
  defaultValue: string
  items: { value: string; label: string; content: React.ReactNode }[]
  inverse?: boolean
  className?: string
}

export function Tabs({ defaultValue, items, inverse = true, className }: TabsProps) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue} className={className}>
      <TabsPrimitive.List
        className={cn(
          'm-0 flex list-none overflow-hidden rounded-t-[5px] p-0',
          inverse ? 'bg-ca-tab-bg' : 'bg-ca-silver',
        )}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'mr-1.5 block cursor-pointer border-none px-[15px] py-2.5 text-xs leading-5 text-ca-heading outline-none',
              'data-[state=active]:bg-white data-[state=inactive]:bg-transparent',
              'data-[state=inactive]:hover:opacity-70',
            )}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          className="mb-5 rounded-b-[3px] bg-white p-[15px] outline-none"
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}

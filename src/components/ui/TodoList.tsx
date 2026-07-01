import { cn } from '@/lib/utils'

export interface TodoItemProps {
  title: string
  completed?: boolean
  onToggle?: () => void
}

export function TodoItem({ title, completed = false, onToggle }: TodoItemProps) {
  return (
    <li className={cn('list-none', completed && 'bg-[#F2FFFB]')}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full border-b border-[#ddd] text-left no-underline hover:bg-[#fafafa]"
      >
        <div className="flex w-[14px] items-center border-r border-[#ddd] px-[15px] py-2.5 text-sm text-ca-text">
          {completed ? '☑' : '☐'}
        </div>
        <div
          className={cn(
            'flex-1 px-[15px] py-2.5 text-ca-heading',
            completed && 'line-through',
          )}
        >
          {title}
        </div>
      </button>
    </li>
  )
}

interface TodoListProps {
  items: TodoItemProps[]
  className?: string
}

export function TodoList({ items, className }: TodoListProps) {
  return (
    <ul className={cn('m-0 list-none p-0', className)}>
      {items.map((item) => (
        <TodoItem key={item.title} {...item} />
      ))}
    </ul>
  )
}

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Input } from './Input'

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: () => void
  icon?: ReactNode
  rounded?: boolean
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, icon, rounded = false, ...props }, ref) => (
    <form
      className="relative"
      onSubmit={(e) => {
        e.preventDefault()
        onSearch?.()
      }}
    >
      <Input
        ref={ref}
        type="text"
        className={cn(
          rounded && 'h-[30px] w-[200px] rounded-full px-[15px] focus:w-[300px]',
          !rounded && 'h-[30px]',
          className,
        )}
        {...props}
      />
      <button
        type="submit"
        className={cn(
          'absolute top-0 right-0 flex h-[30px] items-center border-none bg-transparent px-3 text-ca-text',
          rounded && 'rounded-r-full',
        )}
      >
        {icon}
      </button>
    </form>
  ),
)
SearchInput.displayName = 'SearchInput'

export { SearchInput }

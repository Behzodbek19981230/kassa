import { cn } from '../../lib/utils'
import { Button } from './Button'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <ul className={cn('m-0 flex list-none gap-1 p-0', className)}>
      <li>
        <Button
          variant="white"
          size="sm"
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="border-ca-border"
        >
          Previous
        </Button>
      </li>
      {pages.map((pageNumber) => (
        <li key={pageNumber}>
          <Button
            variant={pageNumber === page ? 'inverse' : 'white'}
            size="sm"
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={pageNumber === page ? '' : 'border-ca-border'}
          >
            {pageNumber}
          </Button>
        </li>
      ))}
      <li>
        <Button
          variant="white"
          size="sm"
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="border-ca-border"
        >
          Next
        </Button>
      </li>
    </ul>
  )
}

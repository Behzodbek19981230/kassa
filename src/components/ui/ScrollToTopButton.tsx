import { FaAngleUp } from 'react-icons/fa'
import { Button } from '@/components/ui/Button'

export function ScrollToTopButton() {
  return (
    <Button
      variant="theme"
      size="icon"
      type="button"
      className="fixed right-[25px] bottom-5 z-[1020] rounded-full"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <FaAngleUp />
    </Button>
  )
}

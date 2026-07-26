import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  useNotification,
} from '@/components/ui'
import { useDeleteTelegramBroadcastMutation } from '@/services/telegram-broadcast/telegram-broadcast.queries'

interface DeleteBroadcastModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  jobId: number
}

export default function DeleteBroadcastModal({ open, setOpen, jobId }: DeleteBroadcastModalProps) {
  const { notify } = useNotification()
  const deleteMutation = useDeleteTelegramBroadcastMutation()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(jobId)
      notify({ title: "Xabarlarni o'chirish boshlandi" })
      setOpen(false)
    } catch {
      notify({ title: "O'chirishda xatolik yuz berdi" })
    }
  }

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>O'chirishni tasdiqlang</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className='mb-2'>Bu broadcast bo'yicha bot yuborgan Telegram xabarlar o'chiriladi.</p>
          <p className='mb-2'>O'chgan xabarlar Telegramdan yo'qoladi.</p>
          <p className='mb-2'>O'chmagan xabarlar "delete_failed" statusida qoladi.</p>
          <p>Keyin ularni qayta o'chirish mumkin.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant='white' onClick={() => setOpen(false)}>
            Bekor qilish
          </Button>
          <Button variant='danger' onClick={handleDelete} disabled={deleteMutation.isPending}>
            Ha, o'chirish
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

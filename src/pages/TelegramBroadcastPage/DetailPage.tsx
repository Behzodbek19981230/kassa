import { useState } from 'react'
import { FaArrowLeft, FaExclamationTriangle, FaRedo, FaTrash } from 'react-icons/fa'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  PageHeader,
  Panel,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useNotification,
} from '@/components/ui'
import OpenDialogButton from '@/components/OpenDialogButton'
import DeleteBroadcastModal from '@/pages/TelegramBroadcastPage/components/DeleteBroadcastModal'
import { BroadcastStatusBadge, DeliveryStatusBadge } from '@/pages/TelegramBroadcastPage/components/StatusBadge'
import {
  useRetryDeleteTelegramBroadcastDeliveryMutation,
  useRetryDeleteTelegramBroadcastMutation,
  useTelegramBroadcastQuery,
} from '@/services/telegram-broadcast/telegram-broadcast.queries'
import type { TelegramBroadcastDelivery } from '@/services/telegram-broadcast/telegram-broadcast.types'

const DELIVERY_LIMIT_OPTIONS = [50, 100, 200, 500]

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const date = d.toLocaleDateString('ru-RU')
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

function deliveryWarehouseLabel(delivery: TelegramBroadcastDelivery) {
  const w = delivery.warehouse_detail
  if (!w) return '-'
  const parts = [w.brand_detail?.name, w.product_category_detail?.name].filter(Boolean)
  return parts.length ? parts.join(' ') : '-'
}

export default function TelegramBroadcastDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const jobId = id ? Number(id) : undefined
  const { notify } = useNotification()

  const [deliveryLimit, setDeliveryLimit] = useState(50)
  const [retryingDeliveryId, setRetryingDeliveryId] = useState<number | null>(null)

  const { data: job, isLoading, isError } = useTelegramBroadcastQuery(jobId, { delivery_limit: deliveryLimit })
  const retryDeleteMutation = useRetryDeleteTelegramBroadcastMutation()
  const retryDeleteDeliveryMutation = useRetryDeleteTelegramBroadcastDeliveryMutation()

  const goBack = () => navigate('/telegram-broadcast')

  const handleRetryDelete = async () => {
    if (!jobId) return
    try {
      await retryDeleteMutation.mutateAsync(jobId)
      notify({ title: "Qayta o'chirish boshlandi" })
    } catch {
      notify({ title: 'Xatolik yuz berdi' })
    }
  }

  const handleRetryDeleteDelivery = async (deliveryId: number) => {
    setRetryingDeliveryId(deliveryId)
    try {
      await retryDeleteDeliveryMutation.mutateAsync(deliveryId)
      notify({ title: "Qayta o'chirish boshlandi" })
    } catch {
      notify({ title: 'Xatolik yuz berdi' })
    } finally {
      setRetryingDeliveryId(null)
    }
  }

  if (isLoading) {
    return <div className='p-5 text-center text-ca-text'>Yuklanmoqda...</div>
  }

  if (isError || !job) {
    return (
      <div className='flex items-center justify-center gap-2 p-5 text-ca-red'>
        <FaExclamationTriangle /> Broadcast topilmadi
      </div>
    )
  }

  const deliveries = job.deliveries ?? []
  const progressPercent = job.total_count > 0 ? (job.sent_count / job.total_count) * 100 : 0
  const showDeleteAction = ['pending', 'processing', 'done', 'partial', 'failed', 'deleting'].includes(job.status)
  const showRetryDeleteAction = job.status === 'partial_deleted'

  return (
    <>
      <PageHeader
        title={`Broadcast #${job.id}`}
        breadcrumb={[
          { label: 'Asosiy', path: '/' },
          { label: 'Telegram xabarnomalar', path: '/telegram-broadcast' },
          { label: `#${job.id}`, active: true },
        ]}
      />

      <Panel
        title={`Broadcast #${job.id}`}
        actions={
          <Button type='button' variant='warning' size='xs' onClick={goBack}>
            <FaArrowLeft className='mr-1.5' /> Orqaga qaytish
          </Button>
        }
      >
        <div className='mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div className='divide-y divide-ca-border text-xs'>
            <div className='flex items-center justify-between py-2.5'>
              <span className='font-semibold text-ca-heading'>Status:</span>
              <BroadcastStatusBadge status={job.status} />
            </div>
            <div className='flex items-center justify-between py-2.5'>
              <span className='font-semibold text-ca-heading'>Yuborilgan:</span>
              <span className='font-bold text-ca-green'>{job.sent_count}</span>
            </div>
            <div className='flex items-center justify-between py-2.5'>
              <span className='font-semibold text-ca-heading'>Xato:</span>
              <span className='font-bold text-ca-red'>{job.error_count}</span>
            </div>
            <div className='flex items-center justify-between py-2.5'>
              <span className='font-semibold text-ca-heading'>Warehouse:</span>
              <span className='font-bold text-ca-heading'>{job.warehouses_count} ta</span>
            </div>
            <div className='flex items-center justify-between py-2.5'>
              <span className='font-semibold text-ca-heading'>Client:</span>
              <span className='font-bold text-ca-heading'>{job.clients_count} ta</span>
            </div>
            <div className='flex items-center justify-between py-2.5'>
              <span className='font-semibold text-ca-heading'>Yaratilgan:</span>
              <span className='font-bold text-ca-heading'>{formatDateTime(job.created_time)}</span>
            </div>
          </div>

          <div className='flex flex-col gap-3'>
            <div>
              <div className='mb-1 flex items-center justify-between text-xs'>
                <span className='font-semibold text-ca-heading'>Progress</span>
                <span className='font-semibold text-ca-heading'>
                  {job.sent_count} / {job.total_count}
                </span>
              </div>
              <Progress value={progressPercent} variant='success' size='md' />
            </div>

            {job.text && (
              <div>
                <p className='mb-1 text-xs font-semibold text-ca-heading'>Text:</p>
                <p className='rounded-[3px] border border-ca-border bg-ca-silver/40 p-3 text-xs whitespace-pre-wrap text-ca-text'>
                  {job.text}
                </p>
              </div>
            )}

            <div className='mt-auto flex flex-wrap gap-2'>
              {showDeleteAction && (
                <OpenDialogButton
                  element={(props) => <Button {...props} />}
                  elementProps={{
                    variant: 'danger' as const,
                    size: 'sm' as const,
                    disabled: job.status === 'deleting',
                    children: (
                      <>
                        <FaTrash className='mr-1.5' /> {job.status === 'deleting' ? "O'chirilmoqda..." : 'Botdan xabarlarni o\'chirish'}
                      </>
                    ),
                  }}
                  dialog={DeleteBroadcastModal}
                  dialogProps={{ jobId: job.id }}
                />
              )}
              {showRetryDeleteAction && (
                <Button
                  type='button'
                  variant='warning'
                  size='sm'
                  onClick={handleRetryDelete}
                  disabled={retryDeleteMutation.isPending}
                >
                  <FaRedo className='mr-1.5' /> O'chmay qolganlarni qayta o'chirish
                </Button>
              )}
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title='Deliverylar'
        toolbar={
          <div className='flex items-center gap-2'>
            <span className='text-xs font-semibold text-ca-heading'>Limit:</span>
            <Select value={String(deliveryLimit)} onValueChange={(v) => setDeliveryLimit(Number(v))}>
              <SelectTrigger className='w-28'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_LIMIT_OPTIONS.map((limit) => (
                  <SelectItem key={limit} value={String(limit)}>
                    {limit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className='overflow-x-auto rounded-[3px] bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Mijoz</TableHead>
                <TableHead>Telegram ID</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message ID</TableHead>
                <TableHead>Xato</TableHead>
                <TableHead>Yuborilgan vaqt</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className='text-center text-ca-text'>
                    Deliverylar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>{delivery.id}</TableCell>
                    <TableCell>{delivery.client_detail?.fio ?? delivery.client}</TableCell>
                    <TableCell>{delivery.telegram_id ?? '-'}</TableCell>
                    <TableCell>{deliveryWarehouseLabel(delivery)}</TableCell>
                    <TableCell>
                      <DeliveryStatusBadge status={delivery.status} />
                    </TableCell>
                    <TableCell>{delivery.message_id ?? '-'}</TableCell>
                    <TableCell className='text-ca-red'>{delivery.error ?? '-'}</TableCell>
                    <TableCell>{formatDateTime(delivery.sent_time)}</TableCell>
                    <TableCell>
                      {delivery.status === 'delete_failed' ? (
                        <Button
                          type='button'
                          variant='warning'
                          size='xs'
                          disabled={retryingDeliveryId === delivery.id}
                          onClick={() => handleRetryDeleteDelivery(delivery.id)}
                        >
                          <FaRedo className='mr-1' /> Qayta o'chirish
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </>
  )
}

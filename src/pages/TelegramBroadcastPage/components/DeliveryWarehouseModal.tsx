import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui'
import { formatNumber } from '@/lib/number'
import { useWarehouseImageListQuery } from '@/services/warehouse-image/warehouse-image.queries'
import type {
  TelegramBroadcastDelivery,
  TelegramBroadcastWarehouse,
} from '@/services/telegram-broadcast/telegram-broadcast.types'

interface DeliveryWarehouseModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  delivery: TelegramBroadcastDelivery
  warehouse?: TelegramBroadcastWarehouse
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='flex items-center justify-between gap-3 py-2'>
      <span className='font-semibold text-ca-heading'>{label}:</span>
      <span className='text-right font-bold text-ca-heading'>{children}</span>
    </div>
  )
}

export default function DeliveryWarehouseModal({ open, setOpen, delivery, warehouse }: DeliveryWarehouseModalProps) {
  const warehouseId = delivery.warehouse ?? undefined
  const { data: imagesData } = useWarehouseImageListQuery({ warehouse: warehouseId, limit: 100 })

  // Main image first, then by gallery position.
  const images = useMemo(
    () =>
      [...(imagesData?.results ?? [])].sort(
        (a, b) =>
          Number(!!b.is_main) - Number(!!a.is_main) ||
          (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER),
      ),
    [imagesData],
  )

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Tovar ma'lumotlari</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className='mb-1 text-xs font-semibold text-ca-heading uppercase'>Mijoz</p>
          <div className='mb-4 divide-y divide-ca-border text-xs'>
            <InfoRow label='Mijoz ID'>{delivery.client ?? '-'}</InfoRow>
            <InfoRow label='Telegram ID'>{delivery.telegram_id ?? '-'}</InfoRow>
          </div>

          <p className='mb-1 text-xs font-semibold text-ca-heading uppercase'>Tovar</p>
          {!warehouseId ? (
            <p className='text-xs text-ca-text'>Tovar biriktirilmagan</p>
          ) : (
            <>
              <div className='divide-y divide-ca-border text-xs'>
                <InfoRow label='ID'>{warehouseId}</InfoRow>
                <InfoRow label='Kompaniya'>{warehouse?.company_detail?.name ?? '-'}</InfoRow>
                <InfoRow label='Brend'>{warehouse?.brand_detail?.name ?? '-'}</InfoRow>
                <InfoRow label='Kategoriya'>
                  {warehouse?.product_category_detail?.name ?? delivery.warehouse_name ?? '-'}
                </InfoRow>
                {warehouse && (
                  <>
                    <InfoRow label='Turi'>{warehouse.type_detail?.name ?? '-'}</InfoRow>
                    <InfoRow label='Sklad turi'>{warehouse.type_sklad_detail?.name ?? '-'}</InfoRow>
                    <InfoRow label="O'lcham">{formatNumber(warehouse.size, 2)}</InfoRow>
                    <InfoRow label='Soni'>{formatNumber(warehouse.count)} ta</InfoRow>
                    <InfoRow label='Narxi'>{formatNumber(warehouse.real_price, 2)} $</InfoRow>
                    <InfoRow label='Sana'>{warehouse.cr_date}</InfoRow>
                  </>
                )}
              </div>

              {images.length > 0 && (
                <div className='mt-3 grid grid-cols-3 gap-2'>
                  {images.map((img) => (
                    <a key={img.id} href={img.image} target='_blank' rel='noreferrer'>
                      <img
                        src={img.image}
                        alt=''
                        className='aspect-square w-full rounded-[3px] border border-ca-border object-cover'
                      />
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant='white' onClick={() => setOpen(false)}>
            Yopish
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

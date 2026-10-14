import { useMemo } from 'react'
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
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
  warehouses: TelegramBroadcastWarehouse[]
}

function WarehouseImages({ warehouseId }: { warehouseId: number }) {
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

  if (images.length === 0) return <span className='text-ca-text'>-</span>

  return (
    <div className='flex gap-1'>
      {images.map((img) => (
        <a key={img.id} href={img.image} target='_blank' rel='noreferrer' className='shrink-0'>
          <img src={img.image} alt='' className='h-10 w-10 rounded-[3px] border border-ca-border object-cover' />
        </a>
      ))}
    </div>
  )
}

export default function DeliveryWarehouseModal({ open, setOpen, delivery, warehouses }: DeliveryWarehouseModalProps) {
  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent className='max-w-5xl'>
        <ModalHeader>
          <ModalTitle>Tovar ma'lumotlari</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className='mb-3 text-xs text-ca-heading'>
            <span className='font-semibold'>Telegram ID:</span> <span className='font-bold'>{delivery.telegram_id ?? '-'}</span>
          </p>

          {warehouses.length === 0 ? (
            <p className='text-xs text-ca-text'>{delivery.warehouse_name || 'Tovar biriktirilmagan'}</p>
          ) : (
            <div className='max-h-[60vh] overflow-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rasm</TableHead>
                    <TableHead>Kompaniya</TableHead>
                    <TableHead>Brend</TableHead>
                    <TableHead>Kategoriya</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead>Sklad turi</TableHead>
                    <TableHead className='text-right'>O'lcham</TableHead>
                    <TableHead className='text-right'>Soni</TableHead>
                    <TableHead className='text-right'>Narxi</TableHead>
                    <TableHead>Sana</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell>
                        <WarehouseImages warehouseId={warehouse.id} />
                      </TableCell>
                      <TableCell>{warehouse.company_detail?.name ?? '-'}</TableCell>
                      <TableCell className='font-semibold'>{warehouse.brand_detail?.name ?? '-'}</TableCell>
                      <TableCell>{warehouse.product_category_detail?.name ?? '-'}</TableCell>
                      <TableCell>{warehouse.type_detail?.name ?? '-'}</TableCell>
                      <TableCell>{warehouse.type_sklad_detail?.name ?? '-'}</TableCell>
                      <TableCell className='text-right'>{formatNumber(warehouse.size, 2)}</TableCell>
                      <TableCell className='text-right'>{formatNumber(warehouse.count)} ta</TableCell>
                      <TableCell className='text-right font-semibold'>{formatNumber(warehouse.real_price, 2)} $</TableCell>
                      <TableCell className='whitespace-nowrap'>{warehouse.cr_date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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

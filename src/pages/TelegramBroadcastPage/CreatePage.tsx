import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { useDropzone } from 'react-dropzone'
import { FaArrowLeft, FaCloudUploadAlt, FaSpinner, FaTimes } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Checkbox,
  FormField,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  MultiCombobox,
  PageHeader,
  Panel,
  RadioGroup,
  Textarea,
  useNotification,
} from '@/components/ui'
import type { ComboboxLoadParams, ComboboxLoadResult } from '@/components/ui'
import { cn } from '@/lib/utils'
import { clientService } from '@/services/client/client.service'
import {
  useCreateAllTelegramBroadcastMutation,
  useCreateTelegramBroadcastMutation,
} from '@/services/telegram-broadcast/telegram-broadcast.queries'
import { warehouseService } from '@/services/warehouse/warehouse.service'

const LARGE_BROADCAST_THRESHOLD = 50

const CLIENT_STATUS_OPTIONS = [
  { value: 'ordinary', label: 'Oddiy' },
  { value: 'new_telegram', label: 'Yangi Telegram' },
  { value: 'confirmed_telegram', label: 'Tasdiqlangan Telegram' },
] as const

type ClientStatus = (typeof CLIENT_STATUS_OPTIONS)[number]['value']

function warehouseLabel(w: { brand_detail?: { name: string } | null; product_category_detail?: { name: string } | null; size: number }) {
  const parts = [w.brand_detail?.name, w.product_category_detail?.name].filter(Boolean)
  return `${parts.join(' ')} — ${w.size}`.trim()
}

export default function TelegramBroadcastCreatePage() {
  const navigate = useNavigate()
  const { notify } = useNotification()

  const [postType, setPostType] = useState<'new' | 'existing'>('new')
  const [clientStatus, setClientStatus] = useState<ClientStatus>('ordinary')
  const [clientIds, setClientIds] = useState<string[]>([])
  const [selectAllClients, setSelectAllClients] = useState(false)
  const [loadingAllClients, setLoadingAllClients] = useState(false)
  const [allClientsCount, setAllClientsCount] = useState(0)
  const [warehouseIds, setWarehouseIds] = useState<string[]>([])
  const [text, setText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const createMutation = useCreateTelegramBroadcastMutation()
  const createAllMutation = useCreateAllTelegramBroadcastMutation()
  const isSubmitting = createMutation.isPending || createAllMutation.isPending

  const loadClientOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
    const result = await clientService.list({
      search: search || undefined,
      page,
      limit: 20,
      is_telegram_started: 1,
      status: clientStatus,
    })
    return {
      options: result.results.map((c) => ({ value: String(c.id), label: `${c.fio} — ${c.phone}` })),
      hasMore: result.pagination.currentPage < result.pagination.lastPage,
    }
  }

  const loadWarehouseOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
    const result = await warehouseService.list({ search: search || undefined, page, limit: 20 })
    return {
      options: result.results.map((w) => ({ value: String(w.id), label: warehouseLabel(w) })),
      hasMore: result.pagination.currentPage < result.pagination.lastPage,
    }
  }

  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDrop,
  })

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handlePostTypeChange = (value: string) => {
    const next = value as 'new' | 'existing'
    setPostType(next)
    if (next === 'new') setWarehouseIds([])
    else removeImage()
  }

  const handleSelectAllClientsChange = async (checked: boolean) => {
    setSelectAllClients(checked)
    setClientIds([])
    if (!checked) {
      setAllClientsCount(0)
      return
    }
    setLoadingAllClients(true)
    try {
      const result = await clientService.list({ page: 1, limit: 1, is_telegram_started: 1, status: clientStatus })
      setAllClientsCount(result.pagination.total)
    } catch {
      notify({ title: 'Mijozlar sonini yuklashda xatolik yuz berdi' })
      setSelectAllClients(false)
    } finally {
      setLoadingAllClients(false)
    }
  }

  const handleClientStatusChange = (value: string) => {
    setClientStatus(value as ClientStatus)
    setClientIds([])
    setSelectAllClients(false)
    setAllClientsCount(0)
  }

  const clientCount = selectAllClients ? allClientsCount : clientIds.length
  const warehouseCount = warehouseIds.length
  const totalCount = useMemo(() => {
    if (warehouseCount > 0) return clientCount * (warehouseCount + (image ? 1 : 0))
    return clientCount
  }, [clientCount, warehouseCount, image])

  const goBack = () => navigate('/telegram-broadcast')

  const validate = () => {
    if (clientCount === 0) return 'Kamida bitta mijoz tanlanishi shart'
    if (postType === 'existing') {
      if (warehouseCount === 0) return 'Kamida bitta mavjud tovar tanlanishi shart'
    } else if (!text.trim() && !image) {
      return "Matn yoki rasmdan kamida bittasi bo'lishi shart"
    }
    return ''
  }

  const submit = async () => {
    try {
      const result = selectAllClients
        ? await createAllMutation.mutateAsync({
            warehouse_ids: warehouseIds.length ? warehouseIds.map(Number) : undefined,
            text: text.trim() || undefined,
            image,
          })
        : await createMutation.mutateAsync({
            client_ids: clientIds.map(Number),
            warehouse_ids: warehouseIds.length ? warehouseIds.map(Number) : undefined,
            text: text.trim() || undefined,
            image,
          })
      notify({ title: 'Xabarnoma yuborish boshlandi' })
      navigate(`/telegram-broadcast/${result.job_id}`)
    } catch {
      notify({ title: 'Yuborishda xatolik yuz berdi' })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const error = validate()
    setFormError(error)
    if (error) return

    if (totalCount > LARGE_BROADCAST_THRESHOLD) {
      setConfirmOpen(true)
      return
    }
    await submit()
  }

  const handleConfirm = async () => {
    setConfirmOpen(false)
    await submit()
  }

  return (
    <>
      <PageHeader
        title='Telegram Broadcast Yaratish'
        breadcrumb={[
          { label: 'Asosiy', path: '/' },
          { label: 'Telegram xabarnomalar', path: '/telegram-broadcast' },
          { label: 'Yaratish', active: true },
        ]}
      />

      <Panel
        title='Telegram Broadcast Yaratish'
        actions={
          <Button type='button' variant='warning' size='xs' onClick={goBack}>
            <FaArrowLeft className='mr-1.5' /> Orqaga qaytish
          </Button>
        }
      >
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
              {formError}
            </div>
          )}

          <FormField label='Mijozlar statusi' horizontal={false}>
            <RadioGroup
              name='client-status'
              value={clientStatus}
              onChange={handleClientStatusChange}
              inline
              options={CLIENT_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </FormField>

          <FormField label='Mijozlar tanlash' required horizontal={false}>
            <Checkbox
              label='Barchasini tanlash'
              checked={selectAllClients}
              onCheckedChange={handleSelectAllClientsChange}
              disabled={loadingAllClients}
            />
            {selectAllClients ? (
              <div className='flex min-h-[34px] items-center gap-2 rounded-[3px] border border-[#ccd0d4] bg-ca-silver/40 px-2.5 py-1.5 text-xs text-ca-heading'>
                {loadingAllClients ? (
                  <>
                    <FaSpinner className='animate-spin' /> Yuklanmoqda...
                  </>
                ) : (
                  <>
                    Barcha mijozlarga yuboriladi: <span className='font-semibold'>{allClientsCount} ta</span>
                  </>
                )}
              </div>
            ) : (
              <MultiCombobox
                value={clientIds}
                onChange={setClientIds}
                loadOptions={loadClientOptions}
                placeholder='Mijozlarni tanlang'
              />
            )}
          </FormField>

          <FormField label='Post turi' horizontal={false}>
            <RadioGroup
              name='post-type'
              value={postType}
              onChange={handlePostTypeChange}
              inline
              options={[
                { value: 'new', label: 'Yangi post' },
                { value: 'existing', label: 'Mavjud tovar' },
              ]}
            />
          </FormField>

          {postType === 'existing' && (
            <FormField label='Warehouse tanlash' required horizontal={false}>
              <MultiCombobox
                value={warehouseIds}
                onChange={setWarehouseIds}
                loadOptions={loadWarehouseOptions}
                placeholder='Warehouse mahsulotlarini tanlang'
              />
            </FormField>
          )}

          <FormField label='Xabar matni' horizontal={false}>
            <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder='Xabar matnini kiriting' />
          </FormField>

          {postType === 'new' && (
            <FormField label='Umumiy rasm' horizontal={false}>
              {imagePreview ? (
                <div className='relative inline-block'>
                  <img src={imagePreview} alt='Umumiy rasm' className='h-32 w-32 rounded-lg border border-ca-border object-cover' />
                  <button
                    type='button'
                    aria-label="Rasmni o'chirish"
                    onClick={removeImage}
                    className='absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-ca-red text-white shadow'
                  >
                    <FaTimes className='text-xs' />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ca-border bg-ca-silver/60 px-6 py-6 text-center transition-colors hover:border-ca-theme hover:bg-ca-theme/5',
                    isDragActive && 'border-ca-theme bg-ca-theme/10',
                  )}
                >
                  <input {...getInputProps()} />
                  <FaCloudUploadAlt className='mb-2 text-2xl text-ca-theme' />
                  <p className='text-xs font-medium text-ca-heading'>Rasm qo'shish uchun bosing yoki shu yerga tashlang</p>
                </div>
              )}
            </FormField>
          )}

          <div className='mb-4 rounded-[3px] border border-ca-border bg-ca-silver/40 px-4 py-3 text-xs'>
            <h4 className='mb-2 text-sm font-semibold text-ca-heading'>Preview</h4>
            <div className='divide-y divide-ca-border'>
              <div className='flex items-center justify-between py-1.5'>
                <span className='text-ca-text'>Mijozlar:</span>
                <span className='font-semibold text-ca-heading'>{clientCount} ta</span>
              </div>
              <div className='flex items-center justify-between py-1.5'>
                <span className='text-ca-text'>Warehouse:</span>
                <span className='font-semibold text-ca-heading'>{warehouseCount} ta</span>
              </div>
              <div className='flex items-center justify-between py-1.5'>
                <span className='text-ca-text'>Umumiy image:</span>
                <span className='font-semibold text-ca-heading'>{image ? 'Bor' : "Yo'q"}</span>
              </div>
              <div className='flex items-center justify-between py-1.5'>
                <span className='text-ca-text'>Jami xabar:</span>
                <span className='font-semibold text-ca-theme'>{totalCount} ta</span>
              </div>
            </div>
          </div>

          <Button type='submit' variant='theme' className='h-11 w-full text-sm' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <FaSpinner className='mr-2 animate-spin' /> Yuborilmoqda...
              </>
            ) : (
              'Yuborish'
            )}
          </Button>
        </form>
      </Panel>

      <Modal open={confirmOpen} onOpenChange={setConfirmOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Yuborishni tasdiqlang</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p>
              Jami <span className='font-semibold text-ca-theme'>{totalCount} ta</span> xabar Telegram orqali yuboriladi. Davom
              etasizmi?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant='white' onClick={() => setConfirmOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant='theme' onClick={handleConfirm} disabled={isSubmitting}>
              Ha, yuborish
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

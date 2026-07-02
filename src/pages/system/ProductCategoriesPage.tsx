import { useState } from 'react'
import { FaEdit, FaEye, FaPlus, FaTrash } from 'react-icons/fa'
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  PageHeader,
  Pagination,
  Panel,
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
import {
  useCreateBrandSizeMutation,
  useDeleteBrandSizeMutation,
  useUpdateBrandSizeMutation,
} from '@/services/brand-size/brand-size.queries'
import { brandSizeService } from '@/services/brand-size/brand-size.service'
import { BRAND_SIZE_TYPES, type BrandSizePayload } from '@/services/brand-size/brand-size.types'
import { useBrandListQuery } from '@/services/brand/brand.queries'
import {
  useCreateProductCategoryMutation,
  useDeleteProductCategoryMutation,
  useProductCategoryListQuery,
  useUpdateProductCategoryMutation,
} from '@/services/product-category/product-category.queries'
import type {
  ProductCategory,
  ProductCategoryPayload,
} from '@/services/product-category/product-category.types'

const PAGE_SIZE = 10
const ALL_BRANDS = '__all__'

interface CategoryFormState {
  name: string
  sorting: string
  brand: string
}

interface SizeRowState {
  id?: number
  size: string
  type: string
}

const emptyForm: CategoryFormState = { name: '', sorting: '0', brand: '' }
const emptySizeRow: SizeRowState = { size: '0', type: '' }

export default function ProductCategoriesPage() {
  const { notify } = useNotification()
  const [page, setPage] = useState(1)
  const [nameFilter, setNameFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState(ALL_BRANDS)

  const { data: brandData } = useBrandListQuery({ limit: 100 })
  const brands = brandData?.results ?? []
  const brandNameById = new Map(brands.map((b) => [b.id, b.name]))

  const { data, isLoading, isError } = useProductCategoryListQuery({
    page,
    limit: PAGE_SIZE,
    name: nameFilter || undefined,
    brand: brandFilter === ALL_BRANDS ? undefined : Number(brandFilter),
  })

  const createMutation = useCreateProductCategoryMutation()
  const updateMutation = useUpdateProductCategoryMutation()
  const deleteMutation = useDeleteProductCategoryMutation()
  const createSizeMutation = useCreateBrandSizeMutation()
  const updateSizeMutation = useUpdateBrandSizeMutation()
  const deleteSizeMutation = useDeleteBrandSizeMutation()

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [sizeRows, setSizeRows] = useState<SizeRowState[]>([{ ...emptySizeRow }])
  const [removedSizeIds, setRemovedSizeIds] = useState<number[]>([])
  const [formError, setFormError] = useState('')

  const [viewItem, setViewItem] = useState<ProductCategory | null>(null)
  const [deleteItem, setDeleteItem] = useState<ProductCategory | null>(null)

  const openCreate = () => {
    setFormMode('create')
    setEditingId(null)
    setForm(emptyForm)
    setSizeRows([{ ...emptySizeRow }])
    setRemovedSizeIds([])
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = async (item: ProductCategory) => {
    setFormMode('edit')
    setEditingId(item.id)
    setForm({
      name: item.name,
      sorting: String(item.sorting),
      brand: String(item.brand),
    })
    setRemovedSizeIds([])
    setFormError('')
    setFormOpen(true)

    const existingSizes = await brandSizeService.list({ product_category: item.id })
    setSizeRows(
      existingSizes.results.length
        ? existingSizes.results.map((s) => ({ id: s.id, size: s.size, type: String(s.type) }))
        : [{ ...emptySizeRow }],
    )
  }

  const updateSizeRow = (index: number, patch: Partial<SizeRowState>) => {
    setSizeRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const addSizeRow = () => {
    setSizeRows((rows) => [...rows, { ...emptySizeRow }])
  }

  const removeSizeRow = (index: number) => {
    setSizeRows((rows) => {
      const row = rows[index]
      if (row.id) setRemovedSizeIds((ids) => [...ids, row.id!])
      return rows.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setFormError('Nomi kiritilishi shart')
      return
    }
    if (!form.brand) {
      setFormError('Model tanlanishi shart')
      return
    }

    const brand = Number(form.brand)
    const payload: ProductCategoryPayload = {
      name: form.name.trim(),
      sorting: Number(form.sorting) || 0,
      status: 1,
      sup_status: 1,
      brand,
    }

    try {
      const categoryId =
        formMode === 'edit' && editingId !== null
          ? (await updateMutation.mutateAsync({ id: editingId, payload })).id
          : (await createMutation.mutateAsync(payload)).id

      await Promise.all(removedSizeIds.map((id) => deleteSizeMutation.mutateAsync(id)))

      await Promise.all(
        sizeRows
          .filter((row) => row.type && Number(row.size) > 0)
          .map((row) => {
            const sizePayload: BrandSizePayload = {
              size: Number(row.size),
              type: Number(row.type),
              brand,
              product_category: categoryId,
            }
            return row.id
              ? updateSizeMutation.mutateAsync({ id: row.id, payload: sizePayload })
              : createSizeMutation.mutateAsync(sizePayload)
          }),
      )

      notify({ title: formMode === 'edit' ? 'Mahsulot toifasi yangilandi' : "Mahsulot toifasi qo'shildi" })
      setFormOpen(false)
    } catch {
      setFormError('Saqlashda xatolik yuz berdi')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteMutation.mutateAsync(deleteItem.id)
      notify({ title: "Mahsulot toifasi o'chirildi" })
      setDeleteItem(null)
    } catch {
      notify({ title: "O'chirishda xatolik yuz berdi" })
    }
  }

  const results = data?.results ?? []
  const pagination = data?.pagination
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <PageHeader
        title="Mahsulot toifalari"
        breadcrumb={[
          { label: 'Asosiy', path: '/' },
          { label: 'Mahsulot toifalari', active: true },
        ]}
      />

      <Panel
        title="Ro'yxat"
        actions={
          <Button variant="info" size="xs" onClick={openCreate}>
            Qo'shish +
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <Table className="rounded-[3px] border border-ca-border">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">Tartibi</TableHead>
                <TableHead className="w-[220px]">Model</TableHead>
                <TableHead>Nomi</TableHead>
                <TableHead className="w-[140px] text-center">Harakatlar</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="py-1.5" />
                <TableHead className="py-1.5">
                  <Select
                    value={brandFilter}
                    onValueChange={(v) => {
                      setBrandFilter(v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-[30px]">
                      <SelectValue placeholder="Tanlang..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_BRANDS}>Barchasi</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={String(brand.id)}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead className="py-1.5">
                  <Input
                    value={nameFilter}
                    onChange={(e) => {
                      setNameFilter(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Qidirish..."
                    className="h-[30px]"
                  />
                </TableHead>
                <TableHead className="py-1.5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length ? (
                results.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.sorting}</TableCell>
                    <TableCell className="font-medium text-ca-heading">
                      {brandNameById.get(item.brand) ?? item.brand}
                    </TableCell>
                    <TableCell className="font-medium text-ca-heading">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="info"
                          size="icon"
                          onClick={() => setViewItem(item)}
                          aria-label="Ko'rish"
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="warning"
                          size="icon"
                          onClick={() => {
                            void openEdit(item)
                          }}
                          aria-label="Tahrirlash"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="danger"
                          size="icon"
                          onClick={() => setDeleteItem(item)}
                          aria-label="O'chirish"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    {isError ? 'Xatolik yuz berdi' : isLoading ? 'Yuklanmoqda...' : "Ma'lumot topilmadi"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.lastPage > 1 && (
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>Jami: {pagination.total} ta</div>
            <Pagination page={pagination.currentPage} totalPages={pagination.lastPage} onPageChange={setPage} />
          </div>
        )}
      </Panel>

      <Modal open={formOpen} onOpenChange={setFormOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{formMode === 'edit' ? 'Tahrirlash' : 'Yaratish'}</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {formError && (
              <div className="mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red">
                {formError}
              </div>
            )}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-ca-heading">Model</label>
              <Select value={form.brand} onValueChange={(v) => setForm((f) => ({ ...f, brand: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang..." />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={String(brand.id)}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ca-heading">Tartibi</label>
                <Input
                  type="number"
                  value={form.sorting}
                  onChange={(e) => setForm((f) => ({ ...f, sorting: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ca-heading">Nomi</label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
            </div>

            {!form.brand ? (
              <p className="text-xs text-ca-theme">Avval brandni tanlang</p>
            ) : (
              <div className="border-t border-ca-border pt-3">
                <div className="mb-2 grid grid-cols-[1fr_1fr_32px] gap-3">
                  <label className="text-xs font-semibold text-ca-heading">O'lchami (Misol: 9.99)</label>
                  <label className="text-xs font-semibold text-ca-heading">Tip</label>
                  <span />
                </div>
                {sizeRows.map((row, index) => (
                  <div key={index} className="mb-2 grid grid-cols-[1fr_1fr_32px] items-center gap-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={row.size}
                      onChange={(e) => updateSizeRow(index, { size: e.target.value })}
                    />
                    <Select value={row.type} onValueChange={(v) => updateSizeRow(index, { type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tanlang..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BRAND_SIZE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={String(t.value)}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {index === sizeRows.length - 1 ? (
                      <Button variant="default" size="icon" type="button" onClick={addSizeRow} aria-label="Qator qo'shish">
                        <FaPlus />
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="icon"
                        type="button"
                        onClick={() => removeSizeRow(index)}
                        aria-label="Qatorni o'chirish"
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="white" onClick={() => setFormOpen(false)}>
              Yopish
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
              Saqlash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={Boolean(viewItem)} onOpenChange={(open) => !open && setViewItem(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Toifa ma'lumotlari</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {viewItem && (
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-ca-text">Nomi</dt>
                  <dd className="font-medium text-ca-heading">{viewItem.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ca-text">Model</dt>
                  <dd className="font-medium text-ca-heading">
                    {brandNameById.get(viewItem.brand) ?? viewItem.brand}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ca-text">Tartibi</dt>
                  <dd className="font-medium text-ca-heading">{viewItem.sorting}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ca-text">Holati</dt>
                  <dd className="font-medium text-ca-heading">{viewItem.status === 1 ? 'Faol' : 'Nofaol'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ca-text">Yaratilgan</dt>
                  <dd className="font-medium text-ca-heading">
                    {new Date(viewItem.created_time).toLocaleString()}
                  </dd>
                </div>
              </dl>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="white" onClick={() => setViewItem(null)}>
              Yopish
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>O'chirishni tasdiqlang</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p>"{deleteItem?.name}" nomli toifani o'chirmoqchimisiz?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="white" onClick={() => setDeleteItem(null)}>
              Bekor qilish
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
              O'chirish
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

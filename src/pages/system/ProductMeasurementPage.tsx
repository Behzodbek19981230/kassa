import { createColumnHelper, type PaginationState } from '@tanstack/react-table'
import { useState } from 'react'
import { FaEdit, FaExclamationTriangle, FaEye, FaTrash } from 'react-icons/fa'
import {
  Button,
  Checkbox,
  Combobox,
  type ComboboxLoadParams,
  type ComboboxLoadResult,
  DataTable,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  PageHeader,
  Panel,
  Tabs,
  useNotification,
} from '@/components/ui'
import {
  useBrandSizeTypeListQuery,
  useCreateBrandSizeTypeMutation,
  useDeleteBrandSizeTypeMutation,
  useUpdateBrandSizeTypeMutation,
} from '@/services/brand-size-type/brand-size-type.queries'
import { brandSizeTypeService } from '@/services/brand-size-type/brand-size-type.service'
import type { BrandSizeType, BrandSizeTypePayload } from '@/services/brand-size-type/brand-size-type.types'
import {
  useBrandSizeListQuery,
  useCreateBrandSizeMutation,
  useDeleteBrandSizeMutation,
  useUpdateBrandSizeMutation,
} from '@/services/brand-size/brand-size.queries'
import type { BrandSize, BrandSizePayload } from '@/services/brand-size/brand-size.types'
import { useBrandListQuery } from '@/services/brand/brand.queries'
import { brandService } from '@/services/brand/brand.service'
import { useProductCategoryListQuery } from '@/services/product-category/product-category.queries'
import { productCategoryService } from '@/services/product-category/product-category.service'

const PAGE_SIZE = 10
const ALL_BRANDS = '__all__'

interface SizeFormState {
  brand: string
  product_category: string
  type: string
  size: string
}

const emptySizeForm: SizeFormState = { brand: '', product_category: '', type: '', size: '0' }

const sizeColumnHelper = createColumnHelper<BrandSize>()

function ProductSizesTab() {
  const { notify } = useNotification()
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [brandFilter, setBrandFilter] = useState(ALL_BRANDS)

  const { data: brandData } = useBrandListQuery({ limit: 100 })
  const brands = brandData?.results ?? []
  const brandNameById = new Map(brands.map((b) => [b.id, b.name]))

  const { data: categoryData } = useProductCategoryListQuery({ limit: 100 })
  const categoryNameById = new Map((categoryData?.results ?? []).map((c) => [c.id, c.name]))

  const { data: typeData } = useBrandSizeTypeListQuery({ limit: 100 })
  const typeNameById = new Map((typeData?.results ?? []).map((t) => [t.id, t.name]))

  const { data, isLoading, isFetching, isError, refetch } = useBrandSizeListQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    brand: brandFilter === ALL_BRANDS ? undefined : Number(brandFilter),
  })

  const createMutation = useCreateBrandSizeMutation()
  const updateMutation = useUpdateBrandSizeMutation()
  const deleteMutation = useDeleteBrandSizeMutation()

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<SizeFormState>(emptySizeForm)
  const [formError, setFormError] = useState('')

  const [viewItem, setViewItem] = useState<BrandSize | null>(null)
  const [deleteItem, setDeleteItem] = useState<BrandSize | null>(null)

  const loadBrandOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
    const result = await brandService.list({ search: search || undefined, page, limit: 20 })
    return {
      options: result.results.map((b) => ({ value: String(b.id), label: b.name })),
      hasMore: result.pagination.currentPage < result.pagination.lastPage,
    }
  }

  const loadBrandFilterOptions = async (params: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
    const result = await loadBrandOptions(params)
    if (params.page === 1 && !params.search) {
      return { ...result, options: [{ value: ALL_BRANDS, label: 'Barchasi' }, ...result.options] }
    }
    return result
  }

  const loadCategoryOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
    if (!form.brand) return { options: [], hasMore: false }
    const result = await productCategoryService.list({
      brand: Number(form.brand),
      search: search || undefined,
      page,
      limit: 20,
    })
    return {
      options: result.results.map((c) => ({ value: String(c.id), label: c.name })),
      hasMore: result.pagination.currentPage < result.pagination.lastPage,
    }
  }

  const loadTypeOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
    const result = await brandSizeTypeService.list({ search: search || undefined, page, limit: 20 })
    return {
      options: result.results.filter((t) => t.status).map((t) => ({ value: String(t.id), label: t.name })),
      hasMore: result.pagination.currentPage < result.pagination.lastPage,
    }
  }

  const openCreate = () => {
    setFormMode('create')
    setEditingId(null)
    setForm(emptySizeForm)
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (item: BrandSize) => {
    setFormMode('edit')
    setEditingId(item.id)
    setForm({
      brand: String(item.brand),
      product_category: String(item.product_category),
      type: String(item.type),
      size: item.size,
    })
    setFormError('')
    setFormOpen(true)
  }

  const handleBrandChange = (value: string) => {
    setForm((f) => ({ ...f, brand: value, product_category: '' }))
  }

  const handleSubmit = async () => {
    if (!form.brand) {
      setFormError('Model tanlanishi shart')
      return
    }
    if (!form.product_category) {
      setFormError('Mahsulot toifasi tanlanishi shart')
      return
    }
    if (!form.type) {
      setFormError("O'lcham turi tanlanishi shart")
      return
    }

    const payload: BrandSizePayload = {
      size: Number(form.size) || 0,
      type: Number(form.type),
      brand: Number(form.brand),
      product_category: Number(form.product_category),
    }

    try {
      if (formMode === 'edit' && editingId !== null) {
        await updateMutation.mutateAsync({ id: editingId, payload })
        notify({ title: "O'lcham yangilandi" })
      } else {
        await createMutation.mutateAsync(payload)
        notify({ title: "O'lcham qo'shildi" })
      }
      setFormOpen(false)
    } catch {
      setFormError('Saqlashda xatolik yuz berdi')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteMutation.mutateAsync(deleteItem.id)
      notify({ title: "O'lcham o'chirildi" })
      setDeleteItem(null)
    } catch {
      notify({ title: "O'chirishda xatolik yuz berdi" })
    }
  }

  const results = data?.results ?? []
  const paginationMeta = data?.pagination
  const isSaving = createMutation.isPending || updateMutation.isPending

  const columns = [
    sizeColumnHelper.accessor('size', { header: "O'lchami", size: 100 }),
    sizeColumnHelper.accessor('brand', {
      header: 'Model',
      cell: (info) => brandNameById.get(info.getValue()) ?? info.getValue(),
    }),
    sizeColumnHelper.accessor('product_category', {
      header: 'Mahsulot toifasi',
      cell: (info) => categoryNameById.get(info.getValue()) ?? info.getValue(),
    }),
    sizeColumnHelper.accessor('type', {
      header: 'Turi',
      cell: (info) => typeNameById.get(info.getValue()) ?? info.getValue(),
    }),
    sizeColumnHelper.display({
      id: 'actions',
      header: 'Harakatlar',
      meta: { align: 'right' },
      enableSorting: false,
      size: 150,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="info" size="icon" onClick={() => setViewItem(row.original)} aria-label="Ko'rish">
            <FaEye />
          </Button>
          <Button variant="warning" size="icon" onClick={() => openEdit(row.original)} aria-label="Tahrirlash">
            <FaEdit />
          </Button>
          <Button
            variant="danger"
            size="icon"
            onClick={() => setDeleteItem(row.original)}
            aria-label="O'chirish"
          >
            <FaTrash />
          </Button>
        </div>
      ),
    }),
  ]

  return (
    <>
      <Panel
        title="Ro'yxat"
        actions={
          <Button variant="info" size="xs" onClick={openCreate}>
            Qo'shish +
          </Button>
        }
        onReload={() => {
          refetch()
        }}
      >
        <div className="mb-3 flex flex-wrap gap-3">
          <div className="w-full max-w-[220px]">
            <Combobox
              value={brandFilter}
              onChange={(v) => {
                setBrandFilter(v)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              loadOptions={loadBrandFilterOptions}
              selectedLabel={brandFilter === ALL_BRANDS ? 'Barchasi' : brandNameById.get(Number(brandFilter))}
              placeholder="Model bo'yicha filtr..."
              searchPlaceholder="Model qidirish..."
              className="h-[34px]"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={results}
          manualPagination
          pageCount={paginationMeta?.lastPage ?? -1}
          totalRows={paginationMeta?.total}
          pagination={pagination}
          onPaginationChange={setPagination}
          enableGlobalFilter={false}
          enableSorting={false}
          isLoading={isLoading || isFetching}
          emptyMessage={isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}
          emptyIcon={isError ? <FaExclamationTriangle className="text-4xl text-ca-red" /> : undefined}
        />
      </Panel>

      <Modal open={formOpen} onOpenChange={setFormOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{formMode === 'edit' ? "O'lchamni tahrirlash" : "O'lcham qo'shish"}</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {formError && (
              <div className="mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red">
                {formError}
              </div>
            )}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-ca-heading">Model</label>
              <Combobox
                value={form.brand}
                onChange={handleBrandChange}
                loadOptions={loadBrandOptions}
                selectedLabel={brandNameById.get(Number(form.brand))}
                placeholder="Tanlang..."
                searchPlaceholder="Model qidirish..."
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-ca-heading">Mahsulot toifasi</label>
              {form.brand ? (
                <Combobox
                  value={form.product_category}
                  onChange={(v) => setForm((f) => ({ ...f, product_category: v }))}
                  loadOptions={loadCategoryOptions}
                  selectedLabel={categoryNameById.get(Number(form.product_category))}
                  placeholder="Tanlang..."
                  searchPlaceholder="Toifa qidirish..."
                />
              ) : (
                <p className="text-xs text-ca-theme">Avval brandni tanlang</p>
              )}
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ca-heading">Turi</label>
                <Combobox
                  value={form.type}
                  onChange={(v) => setForm((f) => ({ ...f, type: v }))}
                  loadOptions={loadTypeOptions}
                  selectedLabel={typeNameById.get(Number(form.type))}
                  placeholder="Tanlang..."
                  searchPlaceholder="Tur qidirish..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ca-heading">O'lchami (Misol: 9.99)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.size}
                  onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                />
              </div>
            </div>
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
            <ModalTitle>O'lcham ma'lumotlari</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {viewItem && (
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-ca-text">Model</dt>
                  <dd className="font-medium text-ca-heading">
                    {brandNameById.get(viewItem.brand) ?? viewItem.brand}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ca-text">Mahsulot toifasi</dt>
                  <dd className="font-medium text-ca-heading">
                    {categoryNameById.get(viewItem.product_category) ?? viewItem.product_category}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ca-text">Turi</dt>
                  <dd className="font-medium text-ca-heading">
                    {typeNameById.get(viewItem.type) ?? viewItem.type}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ca-text">O'lchami</dt>
                  <dd className="font-medium text-ca-heading">{viewItem.size}</dd>
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
            <p>"{deleteItem?.size}" o'lchamli yozuvni o'chirmoqchimisiz?</p>
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

interface TypeFormState {
  name: string
  sorting: string
  active: boolean
}

const emptyTypeForm: TypeFormState = { name: '', sorting: '0', active: true }

const typeColumnHelper = createColumnHelper<BrandSizeType>()

function SizeTypesTab() {
  const { notify } = useNotification()

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })

  const { data, isLoading, isFetching, isError, refetch } = useBrandSizeTypeListQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  })

  const createMutation = useCreateBrandSizeTypeMutation()
  const updateMutation = useUpdateBrandSizeTypeMutation()
  const deleteMutation = useDeleteBrandSizeTypeMutation()

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<TypeFormState>(emptyTypeForm)
  const [formError, setFormError] = useState('')
  const [sortingHint, setSortingHint] = useState('')

  const [viewItem, setViewItem] = useState<BrandSizeType | null>(null)
  const [deleteItem, setDeleteItem] = useState<BrandSizeType | null>(null)

  const openCreate = async () => {
    setFormMode('create')
    setEditingId(null)
    setForm(emptyTypeForm)
    setFormError('')
    setSortingHint('')
    setFormOpen(true)

    try {
      const { first_empty_sorting, message } = await brandSizeTypeService.getNextSorting()
      setForm((f) => ({ ...f, sorting: String(first_empty_sorting) }))
      setSortingHint(message)
    } catch {
      // keep default sorting if the suggestion request fails
    }
  }

  const openEdit = (item: BrandSizeType) => {
    setFormMode('edit')
    setEditingId(item.id)
    setForm({ name: item.name, sorting: String(item.sorting), active: item.status })
    setFormError('')
    setSortingHint('')
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setFormError('Nomi kiritilishi shart')
      return
    }

    const payload: BrandSizeTypePayload = {
      name: form.name.trim(),
      sorting: Number(form.sorting) || 0,
      status: form.active,
    }

    try {
      if (formMode === 'edit' && editingId !== null) {
        await updateMutation.mutateAsync({ id: editingId, payload })
        notify({ title: 'Tur yangilandi' })
      } else {
        await createMutation.mutateAsync(payload)
        notify({ title: "Tur qo'shildi" })
      }
      setFormOpen(false)
    } catch {
      setFormError('Saqlashda xatolik yuz berdi')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteMutation.mutateAsync(deleteItem.id)
      notify({ title: "Tur o'chirildi" })
      setDeleteItem(null)
    } catch {
      notify({ title: "O'chirishda xatolik yuz berdi" })
    }
  }

  const results = data?.results ?? []
  const paginationMeta = data?.pagination
  const isSaving = createMutation.isPending || updateMutation.isPending

  const columns = [
    typeColumnHelper.accessor('sorting', { header: 'Tartibi', size: 100, enableColumnFilter: false }),
    typeColumnHelper.accessor('name', { header: 'Nomi', meta: { align: 'left' } }),
    typeColumnHelper.display({
      id: 'actions',
      header: 'Harakatlar',
      meta: { align: 'right' },
      enableSorting: false,
      enableColumnFilter: false,
      size: 150,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="info" size="icon" onClick={() => setViewItem(row.original)} aria-label="Ko'rish">
            <FaEye />
          </Button>
          <Button variant="warning" size="icon" onClick={() => openEdit(row.original)} aria-label="Tahrirlash">
            <FaEdit />
          </Button>
          <Button
            variant="danger"
            size="icon"
            onClick={() => setDeleteItem(row.original)}
            aria-label="O'chirish"
          >
            <FaTrash />
          </Button>
        </div>
      ),
    }),
  ]

  return (
    <>
      <Panel
        title="Ro'yxat"
        actions={
          <Button
            variant="info"
            size="xs"
            onClick={() => {
              void openCreate()
            }}
          >
            Qo'shish +
          </Button>
        }
        onReload={() => {
          refetch()
        }}
      >
        <DataTable
          columns={columns}
          data={results}
          manualPagination
          pageCount={paginationMeta?.lastPage ?? -1}
          totalRows={paginationMeta?.total}
          pagination={pagination}
          onPaginationChange={setPagination}
          enableGlobalFilter={false}
          enableColumnVisibility
          isLoading={isLoading || isFetching}
          emptyMessage={isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}
          emptyIcon={isError ? <FaExclamationTriangle className="text-4xl text-ca-red" /> : undefined}
        />
      </Panel>

      <Modal open={formOpen} onOpenChange={setFormOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{formMode === 'edit' ? 'Turni tahrirlash' : "Tur qo'shish"}</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {formError && (
              <div className="mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red">
                {formError}
              </div>
            )}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-ca-heading">Nomi</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-ca-heading">Tartibi</label>
              <Input
                type="number"
                value={form.sorting}
                onChange={(e) => setForm((f) => ({ ...f, sorting: e.target.value }))}
              />
              {sortingHint && <i className="mt-1 block text-xs text-ca-text">{sortingHint}</i>}
            </div>
            <Checkbox
              inline
              label="Faol"
              checked={form.active}
              onCheckedChange={(v) => setForm((f) => ({ ...f, active: !!v }))}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="white" onClick={() => setFormOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="success" onClick={handleSubmit} disabled={isSaving}>
              Saqlash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={Boolean(viewItem)} onOpenChange={(open) => !open && setViewItem(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Tur ma'lumotlari</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {viewItem && (
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-ca-text">Nomi</dt>
                  <dd className="font-medium text-ca-heading">{viewItem.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ca-text">Tartibi</dt>
                  <dd className="font-medium text-ca-heading">{viewItem.sorting}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ca-text">Holati</dt>
                  <dd className="font-medium text-ca-heading">{viewItem.status ? 'Faol' : 'Nofaol'}</dd>
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
            <p>"{deleteItem?.name}" nomli turni o'chirmoqchimisiz?</p>
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

export default function ProductMeasurementPage() {
  return (
    <>
      <PageHeader
        title="Mahsulot o'lchami"
        breadcrumb={[
          { label: 'Asosiy', path: '/' },
          { label: "Mahsulot o'lchami", active: true },
        ]}
      />

      <Tabs
        defaultValue="sizes"
        items={[
          { value: 'sizes', label: "Mahsulot o'lchami", content: <ProductSizesTab /> },
          { value: 'types', label: "O'lcham turi", content: <SizeTypesTab /> },
        ]}
      />
    </>
  )
}

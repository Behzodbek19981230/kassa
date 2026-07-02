import {
	createColumnHelper,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { FaEdit, FaEye, FaTrash } from 'react-icons/fa';
import {
	Button,
	Checkbox,
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
	useNotification,
} from '@/components/ui';
import {
	useBrandListQuery,
	useCreateBrandMutation,
	useDeleteBrandMutation,
	useUpdateBrandMutation,
} from '@/services/brand/brand.queries';
import type { Brand, BrandPayload } from '@/services/brand/brand.types';

interface BrandFormState {
	name: string;
	sorting: string;
	active: boolean;
}

const emptyForm: BrandFormState = { name: '', sorting: '0', active: true };

const columnHelper = createColumnHelper<Brand>();

export default function ModelsPage() {
	const { notify } = useNotification();

	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const ordering = sorting.length ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
	const nameFilter = columnFilters.find((f) => f.id === 'name')?.value as string | undefined;

	const { data, isLoading, isError, refetch } = useBrandListQuery({
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: nameFilter || undefined,
		ordering,
	});

	const createMutation = useCreateBrandMutation();
	const updateMutation = useUpdateBrandMutation();
	const deleteMutation = useDeleteBrandMutation();

	const [formOpen, setFormOpen] = useState(false);
	const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
	const [editingId, setEditingId] = useState<number | null>(null);
	const [form, setForm] = useState<BrandFormState>(emptyForm);
	const [formError, setFormError] = useState('');

	const [viewItem, setViewItem] = useState<Brand | null>(null);
	const [deleteItem, setDeleteItem] = useState<Brand | null>(null);

	const openCreate = () => {
		setFormMode('create');
		setEditingId(null);
		setForm(emptyForm);
		setFormError('');
		setFormOpen(true);
	};

	const openEdit = (item: Brand) => {
		setFormMode('edit');
		setEditingId(item.id);
		setForm({ name: item.name, sorting: String(item.sorting), active: item.status === 1 });
		setFormError('');
		setFormOpen(true);
	};

	const handleSubmit = async () => {
		if (!form.name.trim()) {
			setFormError('Nomi kiritilishi shart');
			return;
		}

		const payload: BrandPayload = {
			name: form.name.trim(),
			sorting: Number(form.sorting) || 0,
			status: form.active ? 1 : 0,
			sup_status: form.active ? 1 : 0,
		};

		try {
			if (formMode === 'edit' && editingId !== null) {
				await updateMutation.mutateAsync({ id: editingId, payload });
				notify({ title: 'Model yangilandi' });
			} else {
				await createMutation.mutateAsync(payload);
				notify({ title: "Model qo'shildi" });
			}
			setFormOpen(false);
		} catch {
			setFormError('Saqlashda xatolik yuz berdi');
		}
	};

	const handleDelete = async () => {
		if (!deleteItem) return;
		try {
			await deleteMutation.mutateAsync(deleteItem.id);
			notify({ title: "Model o'chirildi" });
			setDeleteItem(null);
		} catch {
			notify({ title: "O'chirishda xatolik yuz berdi" });
		}
	};

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const columns = [
		columnHelper.accessor('sorting', { header: 'Tartibi', size: 100, enableColumnFilter: false }),
		columnHelper.accessor('name', { header: 'Nomi', meta: { align: 'left' } }),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableSorting: false,
			enableColumnFilter: false,
			size: 150,
			cell: ({ row }) => (
				<div className='flex justify-end gap-1'>
					<Button variant='info' size='icon' onClick={() => setViewItem(row.original)} aria-label="Ko'rish">
						<FaEye />
					</Button>
					<Button
						variant='warning'
						size='icon'
						onClick={() => openEdit(row.original)}
						aria-label='Tahrirlash'
					>
						<FaEdit />
					</Button>
					<Button
						variant='danger'
						size='icon'
						onClick={() => setDeleteItem(row.original)}
						aria-label="O'chirish"
					>
						<FaTrash />
					</Button>
				</div>
			),
		}),
	];

	return (
		<>
			<PageHeader
				title='Modellar'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Modellar', active: true },
				]}
			/>

			<Panel
				title="Ro'yxat"
				actions={
					<Button variant='info' size='xs' onClick={openCreate}>
						Qo'shish +
					</Button>
				}
				onReload={() => {
					refetch();
				}}
			>
				<DataTable
					columns={columns}
					data={results}
					manualPagination
					manualSorting
					manualFiltering
					pageCount={paginationMeta?.lastPage ?? -1}
					totalRows={paginationMeta?.total}
					pagination={pagination}
					onPaginationChange={setPagination}
					sorting={sorting}
					onSortingChange={setSorting}
					columnFilters={columnFilters}
					onColumnFiltersChange={setColumnFilters}
					enablePagination
					enableGlobalFilter={false}
					enableColumnFilters
					enableColumnVisibility
					enableSorting
					enableStriping
					isLoading={isLoading}
					emptyMessage={isError ? 'Xatolik yuz berdi' : "Ma'lumot topilmadi"}
				/>
			</Panel>

			<Modal open={formOpen} onOpenChange={setFormOpen}>
				<ModalContent>
					<ModalHeader>
						<ModalTitle>{formMode === 'edit' ? 'Modelni tahrirlash' : "Model qo'shish"}</ModalTitle>
					</ModalHeader>
					<ModalBody>
						{formError && (
							<div className='mb-3 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
								{formError}
							</div>
						)}
						<div className='mb-3'>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>Nomi</label>
							<Input
								value={form.name}
								onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
							/>
						</div>
						<div className='mb-3'>
							<label className='mb-1 block text-xs font-semibold text-ca-heading'>Tartibi</label>
							<Input
								type='number'
								value={form.sorting}
								onChange={(e) => setForm((f) => ({ ...f, sorting: e.target.value }))}
							/>
						</div>
						<Checkbox
							inline
							label='Faol'
							checked={form.active}
							onCheckedChange={(v) => setForm((f) => ({ ...f, active: !!v }))}
						/>
					</ModalBody>
					<ModalFooter>
						<Button variant='white' onClick={() => setFormOpen(false)}>
							Bekor qilish
						</Button>
						<Button variant='success' onClick={handleSubmit} disabled={isSaving}>
							Saqlash
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			<Modal open={Boolean(viewItem)} onOpenChange={(open) => !open && setViewItem(null)}>
				<ModalContent>
					<ModalHeader>
						<ModalTitle>Model ma'lumotlari</ModalTitle>
					</ModalHeader>
					<ModalBody>
						{viewItem && (
							<dl className='space-y-2 text-xs'>
								<div className='flex justify-between'>
									<dt className='text-ca-text'>Nomi</dt>
									<dd className='font-medium text-ca-heading'>{viewItem.name}</dd>
								</div>
								<div className='flex justify-between'>
									<dt className='text-ca-text'>Tartibi</dt>
									<dd className='font-medium text-ca-heading'>{viewItem.sorting}</dd>
								</div>
								<div className='flex justify-between'>
									<dt className='text-ca-text'>Holati</dt>
									<dd className='font-medium text-ca-heading'>
										{viewItem.status === 1 ? 'Faol' : 'Nofaol'}
									</dd>
								</div>
								<div className='flex justify-between'>
									<dt className='text-ca-text'>Yaratilgan</dt>
									<dd className='font-medium text-ca-heading'>
										{new Date(viewItem.created_time).toLocaleString()}
									</dd>
								</div>
							</dl>
						)}
					</ModalBody>
					<ModalFooter>
						<Button variant='white' onClick={() => setViewItem(null)}>
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
						<p>"{deleteItem?.name}" nomli modelni o'chirmoqchimisiz?</p>
					</ModalBody>
					<ModalFooter>
						<Button variant='white' onClick={() => setDeleteItem(null)}>
							Bekor qilish
						</Button>
						<Button variant='danger' onClick={handleDelete} disabled={deleteMutation.isPending}>
							O'chirish
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}

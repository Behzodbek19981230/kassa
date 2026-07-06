import {
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type ColumnFiltersState,
	type ExpandedState,
	type OnChangeFn,
	type PaginationState,
	type RowData,
	type RowSelectionState,
	type SortingState,
	type Updater,
	type VisibilityState,
} from '@tanstack/react-table';

declare module '@tanstack/react-table' {
	interface ColumnMeta<TData extends RowData, TValue> {
		align?: 'left' | 'center' | 'right';
		filterVariant?: 'text' | 'select';
		/** Static option list for a `select` filter, filtered client-side as the user types. */
		filterOptions?: ComboboxOption[];
		/** Loads options from an API for a `select` filter (searchable, paginated). Takes precedence over `filterOptions`. */
		filterLoadOptions?: (params: ComboboxLoadParams) => Promise<ComboboxLoadResult>;
		/** Resolves the label for the current filter value when it isn't among the loaded options yet. */
		filterSelectedLabel?: (value: string) => string | undefined;
		filterPlaceholder?: string;
	}
}

const alignTextClass: Record<'left' | 'center' | 'right', string> = {
	left: 'text-left',
	center: 'text-center',
	right: 'text-right',
};

const alignJustifyClass: Record<'left' | 'center' | 'right', string> = {
	left: 'justify-start',
	center: 'justify-center',
	right: 'justify-end',
};
import { Fragment, useState, type ReactNode } from 'react';
import {
	FaChevronDown,
	FaChevronRight,
	FaColumns,
	FaCopy,
	FaFileCsv,
	FaFileExcel,
	FaFilePdf,
	FaPrint,
	FaSort,
	FaSortDown,
	FaSortUp,
} from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import {
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
	type ComboboxOption,
} from '@/components/ui/Combobox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { FcDeleteDatabase } from 'react-icons/fc';

function resolveUpdater<T>(updater: Updater<T>, current: T): T {
	return typeof updater === 'function' ? (updater as (old: T) => T)(current) : updater;
}

interface DataTableProps<TData> {
	columns: ColumnDef<TData, any>[];
	data: TData[];
	searchPlaceholder?: string;
	pageSizeOptions?: number[];
	className?: string;
	enableSorting?: boolean;
	enableRowSelection?: boolean;
	enableStriping?: boolean;
	enableBordered?: boolean;
	enablePagination?: boolean;
	enableGlobalFilter?: boolean;
	enableColumnFilters?: boolean;
	enableColumnVisibility?: boolean;
	enableColumnResizing?: boolean;
	enableExpanding?: boolean;
	enableExport?: boolean;
	enableExportPdf?: boolean;
	enableExportExcel?: boolean;
	renderExpandedRow?: (row: TData) => ReactNode;
	exportFileName?: string;
	emptyMessage?: ReactNode;
	emptyIcon?: ReactNode;
	isLoading?: boolean;
	skeletonRows?: number;
	/**
	 * Server-driven mode: pass these when `data` is only the current page's
	 * rows fetched from an API, so DataTable defers pagination/sorting/filtering
	 * to the parent instead of slicing `data` itself.
	 */
	manualPagination?: boolean;
	pageCount?: number;
	totalRows?: number;
	pagination?: PaginationState;
	onPaginationChange?: (pagination: PaginationState) => void;
	manualSorting?: boolean;
	sorting?: SortingState;
	onSortingChange?: (sorting: SortingState) => void;
	manualFiltering?: boolean;
	globalFilter?: string;
	onGlobalFilterChange?: (value: string) => void;
	columnFilters?: ColumnFiltersState;
	onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
}

export function DataTable<TData>({
	columns,
	data,
	searchPlaceholder = 'Search...',
	pageSizeOptions = [10, 25, 50],
	className,
	enableSorting = true,
	enableRowSelection = false,
	enableStriping = true,
	enableBordered = false,
	enablePagination = true,
	enableGlobalFilter = true,
	enableColumnFilters = false,
	enableColumnVisibility = false,
	enableColumnResizing = false,
	enableExpanding = false,
	enableExport = false,
	enableExportPdf = false,
	enableExportExcel = false,
	renderExpandedRow,
	exportFileName = 'table-export.csv',
	emptyMessage = 'No data available',
	emptyIcon = <FcDeleteDatabase className='text-4xl text-ca-border' />,
	isLoading = false,
	skeletonRows,
	manualPagination = false,
	pageCount,
	totalRows,
	pagination: controlledPagination,
	onPaginationChange: onControlledPaginationChange,
	manualSorting = false,
	sorting: controlledSorting,
	onSortingChange: onControlledSortingChange,
	manualFiltering = false,
	globalFilter: controlledGlobalFilter,
	onGlobalFilterChange: onControlledGlobalFilterChange,
	columnFilters: controlledColumnFilters,
	onColumnFiltersChange: onControlledColumnFiltersChange,
}: DataTableProps<TData>) {
	const [internalGlobalFilter, setInternalGlobalFilter] = useState('');
	const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([]);
	const [internalSorting, setInternalSorting] = useState<SortingState>([]);
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [expanded, setExpanded] = useState<ExpandedState>({});
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [internalPagination, setInternalPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: pageSizeOptions[0],
	});

	const globalFilter = controlledGlobalFilter ?? internalGlobalFilter;
	const sorting = controlledSorting ?? internalSorting;
	const pagination = controlledPagination ?? internalPagination;
	const columnFilters = controlledColumnFilters ?? internalColumnFilters;

	const handleGlobalFilterChange: OnChangeFn<string> = (updater) => {
		const next = resolveUpdater(updater, globalFilter);
		if (onControlledGlobalFilterChange) onControlledGlobalFilterChange(next);
		else setInternalGlobalFilter(next);
	};
	const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
		const next = resolveUpdater(updater, sorting);
		if (onControlledSortingChange) onControlledSortingChange(next);
		else setInternalSorting(next);
	};
	const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
		const next = resolveUpdater(updater, pagination);
		if (onControlledPaginationChange) onControlledPaginationChange(next);
		else setInternalPagination(next);
	};
	const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
		const next = resolveUpdater(updater, columnFilters);
		if (onControlledColumnFiltersChange) onControlledColumnFiltersChange(next);
		else setInternalColumnFilters(next);
	};

	const table = useReactTable({
		data,
		columns,
		state: {
			globalFilter,
			columnFilters,
			pagination,
			sorting,
			rowSelection,
			expanded,
			columnVisibility,
		},
		onGlobalFilterChange: handleGlobalFilterChange,
		onColumnFiltersChange: handleColumnFiltersChange,
		onPaginationChange: handlePaginationChange,
		onSortingChange: handleSortingChange,
		onRowSelectionChange: setRowSelection,
		onExpandedChange: setExpanded,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
		getPaginationRowModel: enablePagination && !manualPagination ? getPaginationRowModel() : undefined,
		getSortedRowModel: enableSorting && !manualSorting ? getSortedRowModel() : undefined,
		getExpandedRowModel: enableExpanding ? getExpandedRowModel() : undefined,
		getRowCanExpand: enableExpanding ? () => true : undefined,
		enableRowSelection,
		enableColumnResizing,
		columnResizeMode: 'onChange',
		globalFilterFn: 'includesString',
		manualPagination,
		manualSorting,
		manualFiltering,
		pageCount: manualPagination ? (pageCount ?? -1) : undefined,
	});

	const { pageIndex, pageSize } = table.getState().pagination;
	const resolvedSkeletonRows = skeletonRows ?? pageSize;
	const filteredCount = table.getFilteredRowModel().rows.length;
	const totalCount = manualPagination ? (totalRows ?? data.length) : filteredCount;
	const start = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
	const end = manualPagination
		? Math.min((pageIndex + 1) * pageSize, totalCount)
		: Math.min((pageIndex + 1) * pageSize, filteredCount);
	const selectedCount = Object.keys(rowSelection).length;

	function getExportData() {
		const exportableColumns = table
			.getAllLeafColumns()
			.filter((col) => col.getIsVisible() && !['select', 'expand', 'actions'].includes(col.id));
		const headers = exportableColumns.map((col) =>
			typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
		);
		const rows = table
			.getFilteredRowModel()
			.rows.map((row) => exportableColumns.map((col) => String(row.getValue(col.id) ?? '')));
		return { headers, rows };
	}

	function handleCopy() {
		const { headers, rows } = getExportData();
		const text = [headers, ...rows].map((r) => r.join('\t')).join('\n');
		navigator.clipboard.writeText(text);
	}

	function handleExportCsv() {
		const { headers, rows } = getExportData();
		const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
		const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = exportFileName;
		link.click();
		URL.revokeObjectURL(url);
	}

	function handlePrint() {
		const { headers, rows } = getExportData();
		const win = window.open('', '_blank');
		if (!win) return;
		win.document.write(`<!doctype html><html><head><title>Print</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 12px; }
        th { background: #f4f6f7; }
      </style>
      </head><body>
      <table>
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
      </body></html>`);
		win.document.close();
		win.focus();
		win.print();
	}

	function baseFileName() {
		return exportFileName.replace(/\.[^./]+$/, '');
	}

	async function handleExportPdf() {
		const { headers, rows } = getExportData();
		const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
		const doc = new jsPDF();
		autoTable(doc, { head: [headers], body: rows });
		doc.save(`${baseFileName()}.pdf`);
	}

	async function handleExportExcel() {
		const { headers, rows } = getExportData();
		const { Workbook } = await import('exceljs');
		const workbook = new Workbook();
		const worksheet = workbook.addWorksheet('Sheet1');
		worksheet.addRow(headers);
		rows.forEach((row) => worksheet.addRow(row));
		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${baseFileName()}.xlsx`;
		link.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className={className}>
			<div className='mb-2.5 flex flex-wrap items-center justify-between gap-3'>
				<div className='flex flex-wrap items-center gap-2 text-xs'>
					{enablePagination && (
						<>
							<Select
								value={String(pageSize)}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
									table.setPageIndex(0);
								}}
							>
								<SelectTrigger className='h-[30px] w-[70px]'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{pageSizeOptions.map((size) => (
										<SelectItem key={size} value={String(size)}>
											{size}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</>
					)}
					{enableRowSelection && selectedCount > 0 && (
						<span className='text-ca-theme'>{selectedCount} row(s) selected</span>
					)}
				</div>
				<div className='flex flex-wrap items-center gap-2 text-xs'>
					{enableExport && (
						<div className='flex gap-1'>
							<Button type='button' variant='white' size='sm' onClick={handleCopy}>
								<FaCopy className='mr-1.5' /> Copy
							</Button>
							<Button type='button' variant='white' size='sm' onClick={handleExportCsv}>
								<FaFileCsv className='mr-1.5' /> CSV
							</Button>
							<Button type='button' variant='white' size='sm' onClick={handlePrint}>
								<FaPrint className='mr-1.5' /> Print
							</Button>
						</div>
					)}
					{(enableExportPdf || enableExportExcel) && (
						<div className='flex gap-1'>
							{enableExportPdf && (
								<Button type='button' variant='warning' size='sm' onClick={handleExportPdf}>
									<FaFilePdf className='mr-1.5' /> Export PDF
								</Button>
							)}
							{enableExportExcel && (
								<Button type='button' variant='info' size='sm' onClick={handleExportExcel}>
									<FaFileExcel className='mr-1.5' /> Export Excel
								</Button>
							)}
						</div>
					)}
					{enableColumnVisibility && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button type='button' variant='white' size='sm'>
									<FaColumns className='mr-1.5' /> Columns
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className='min-w-[180px] p-2'>
								{table
									.getAllLeafColumns()
									.filter((col) => col.getCanHide())
									.map((col) => (
										<Checkbox
											key={col.id}
											inline
											label={
												typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id
											}
											checked={col.getIsVisible()}
											onCheckedChange={(v) => col.toggleVisibility(!!v)}
											className='px-2 py-1'
										/>
									))}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
					{enableGlobalFilter && (
						<>
							<label htmlFor='datatable-search'>Search:</label>
							<Input
								id='datatable-search'
								type='search'
								value={globalFilter}
								onChange={(e) => {
									handleGlobalFilterChange(e.target.value);
									table.setPageIndex(0);
								}}
								placeholder={searchPlaceholder}
								className='h-[30px] w-auto'
							/>
						</>
					)}
				</div>
			</div>

			<div className='overflow-x-auto'>
				<Table
					className='min-w-[640px] rounded-[3px] border border-ca-border'
					style={enableColumnResizing ? { width: table.getTotalSize() } : undefined}
				>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const align = header.column.columnDef.meta?.align ?? 'left';
									return (
										<TableHead
											key={header.id}
											className={cn(
												'relative',
												alignTextClass[align],
												enableBordered && 'border-x border-t border-ca-border',
											)}
											style={enableColumnResizing ? { width: header.getSize() } : undefined}
										>
											{header.isPlaceholder ? null : (
												<div
													className={cn(
														'flex items-center gap-1',
														alignJustifyClass[align],
														header.column.getCanSort() &&
															enableSorting &&
															'cursor-pointer select-none',
													)}
													onClick={header.column.getToggleSortingHandler()}
												>
													{flexRender(header.column.columnDef.header, header.getContext())}
													{enableSorting && header.column.getCanSort() && (
														<span className='text-[10px] text-ca-text'>
															{{
																asc: <FaSortUp />,
																desc: <FaSortDown />,
															}[header.column.getIsSorted() as string] ?? <FaSort />}
														</span>
													)}
												</div>
											)}
											{enableColumnResizing && header.column.getCanResize() && (
												<div
													onMouseDown={header.getResizeHandler()}
													onTouchStart={header.getResizeHandler()}
													className={cn(
														'absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none',
														header.column.getIsResizing()
															? 'bg-ca-theme'
															: 'hover:bg-ca-border',
													)}
												/>
											)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
						{enableColumnFilters &&
							table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={`${headerGroup.id}-filters`}>
									{headerGroup.headers.map((header) => (
										<TableHead
											key={`${header.id}-filter`}
											className={cn(
												'py-1.5',
												enableBordered && 'border-x border-b border-ca-border',
											)}
										>
											{header.column.getCanFilter() ? (
												header.column.columnDef.meta?.filterVariant === 'select' ? (
													<Combobox
														clearable
														value={(header.column.getFilterValue() as string) ?? ''}
														onChange={(value) => {
															header.column.setFilterValue(value || undefined);
															table.setPageIndex(0);
														}}
														options={header.column.columnDef.meta?.filterOptions}
														loadOptions={header.column.columnDef.meta?.filterLoadOptions}
														selectedLabel={header.column.columnDef.meta?.filterSelectedLabel?.(
															(header.column.getFilterValue() as string) ?? '',
														)}
														placeholder={header.column.columnDef.meta?.filterPlaceholder ?? 'Barchasi'}
														searchPlaceholder='Qidirish...'
														className='h-[26px] text-[11px]'
													/>
												) : (
													<Input
														value={(header.column.getFilterValue() as string) ?? ''}
														onChange={(e) => {
															header.column.setFilterValue(e.target.value);
															table.setPageIndex(0);
														}}
														placeholder='Filter...'
														className='h-[26px] text-[11px]'
													/>
												)
											) : null}
										</TableHead>
									))}
								</TableRow>
							))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: resolvedSkeletonRows }).map((_, rowIndex) => (
								<TableRow key={`skeleton-${rowIndex}`}>
									{columns.map((_col, colIndex) => (
										<TableCell key={colIndex}>
											<Skeleton className='h-4 w-full' />
										</TableCell>
									))}
								</TableRow>
							))
						) : table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row, index) => (
								<Fragment key={row.id}>
									<TableRow className='group'>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className={cn(
													alignTextClass[cell.column.columnDef.meta?.align ?? 'left'],
													enableStriping && index % 2 === 0 && 'bg-ca-table-stripe',
													'group-hover:bg-ca-table-hover',
													enableBordered && 'border-x border-b border-ca-border',
													row.getIsSelected() && 'bg-[#ffc]!',
												)}
												style={
													enableColumnResizing ? { width: cell.column.getSize() } : undefined
												}
											>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
									{enableExpanding && row.getIsExpanded() && (
										<TableRow>
											<TableCell
												colSpan={row.getVisibleCells().length}
												className='bg-ca-silver-light'
											>
												{renderExpandedRow ? renderExpandedRow(row.original) : null}
											</TableCell>
										</TableRow>
									)}
								</Fragment>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className='p-0'>
									<div className='flex h-40 flex-col items-center justify-center gap-2 text-ca-text'>
										{emptyIcon}
										<div className='text-xs'>{emptyMessage}</div>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{enablePagination && (
				<div className='mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs'>
					<div>
						Showing {start} to {end} of {totalCount} entries
					</div>
					<Pagination
						page={pageIndex + 1}
						totalPages={table.getPageCount()}
						onPageChange={(p) => table.setPageIndex(p - 1)}
					/>
				</div>
			)}
		</div>
	);
}

export function createSelectColumn<TData>(): ColumnDef<TData, unknown> {
	return {
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				label=''
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
			/>
		),
		cell: ({ row }) => (
			<Checkbox label='' checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
		),
		enableSorting: false,
		enableHiding: false,
		enableColumnFilter: false,
		enableResizing: false,
		size: 36,
	};
}

export function createExpandColumn<TData>(): ColumnDef<TData, unknown> {
	return {
		id: 'expand',
		header: () => null,
		cell: ({ row }) => (
			<button
				type='button'
				onClick={row.getToggleExpandedHandler()}
				className='flex h-5 w-5 items-center justify-center text-ca-text hover:text-ca-heading'
				aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
			>
				{row.getIsExpanded() ? (
					<FaChevronDown className='text-[10px]' />
				) : (
					<FaChevronRight className='text-[10px]' />
				)}
			</button>
		),
		enableSorting: false,
		enableHiding: false,
		enableColumnFilter: false,
		enableResizing: false,
		size: 36,
	};
}

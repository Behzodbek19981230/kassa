import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { advancedTableRows } from '@/data/advancedTableData'
import type { AdvancedTableRow } from '@/types'
import {
  Badge,
  Button,
  Checkbox,
  createExpandColumn,
  createSelectColumn,
  DataTable,
  PageHeader,
  Panel,
} from '@/components/ui'

const columnHelper = createColumnHelper<AdvancedTableRow>()

export default function AdvancedTablePage() {
  const [enablePagination, setEnablePagination] = useState(true)
  const [enableStriping, setEnableStriping] = useState(true)
  const [enableBordered, setEnableBordered] = useState(false)
  const [enableSorting, setEnableSorting] = useState(true)
  const [enableGlobalFilter, setEnableGlobalFilter] = useState(true)
  const [enableColumnFilters, setEnableColumnFilters] = useState(false)
  const [enableRowSelection, setEnableRowSelection] = useState(true)
  const [enableExpanding, setEnableExpanding] = useState(true)
  const [enableColumnVisibility, setEnableColumnVisibility] = useState(true)
  const [enableColumnResizing, setEnableColumnResizing] = useState(false)
  const [enableRowActions, setEnableRowActions] = useState(true)
  const [enableExport, setEnableExport] = useState(true)

  const columns = useMemo<ColumnDef<AdvancedTableRow, any>[]>(() => {
    const cols: ColumnDef<AdvancedTableRow, any>[] = []
    if (enableExpanding) cols.push(createExpandColumn<AdvancedTableRow>())
    if (enableRowSelection) cols.push(createSelectColumn<AdvancedTableRow>())
    cols.push(
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('position', { header: 'Position' }),
      columnHelper.accessor('office', { header: 'Office' }),
      columnHelper.accessor('age', { header: 'Age' }),
      columnHelper.accessor('startDate', { header: 'Start Date' }),
      columnHelper.accessor('salary', { header: 'Salary' }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={info.getValue() === 'Active' ? 'success' : 'default'}>
            {info.getValue()}
          </Badge>
        ),
      }),
    )
    if (enableRowActions) {
      cols.push(
        columnHelper.display({
          id: 'actions',
          header: 'Actions',
          cell: () => (
            <div className="flex gap-1">
              <Button variant="primary" size="xs">
                Edit
              </Button>
              <Button variant="danger" size="xs">
                Delete
              </Button>
            </div>
          ),
          enableSorting: false,
          enableColumnFilter: false,
          enableHiding: false,
          enableResizing: false,
        }),
      )
    }
    return cols
  }, [enableExpanding, enableRowSelection, enableRowActions])

  return (
    <>
      <PageHeader
        title="Advanced Data Table"
        subtitle="Pagination, sorting, filtering, selection, expanding, resizing & export - all in one"
        breadcrumb={[
          { label: 'Home', path: '/' },
          { label: 'Tables' },
          { label: 'Managed Tables' },
          { label: 'Advanced', active: true },
        ]}
      />

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5">
          <Panel title="Table Options">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
              <Checkbox
                inline
                label="Pagination"
                checked={enablePagination}
                onCheckedChange={(v) => setEnablePagination(!!v)}
              />
              <Checkbox
                inline
                label="Striped rows"
                checked={enableStriping}
                onCheckedChange={(v) => setEnableStriping(!!v)}
              />
              <Checkbox
                inline
                label="Bordered rows"
                checked={enableBordered}
                onCheckedChange={(v) => setEnableBordered(!!v)}
              />
              <Checkbox
                inline
                label="Sortable columns"
                checked={enableSorting}
                onCheckedChange={(v) => setEnableSorting(!!v)}
              />
              <Checkbox
                inline
                label="Global search"
                checked={enableGlobalFilter}
                onCheckedChange={(v) => setEnableGlobalFilter(!!v)}
              />
              <Checkbox
                inline
                label="Column filters"
                checked={enableColumnFilters}
                onCheckedChange={(v) => setEnableColumnFilters(!!v)}
              />
              <Checkbox
                inline
                label="Selectable rows"
                checked={enableRowSelection}
                onCheckedChange={(v) => setEnableRowSelection(!!v)}
              />
              <Checkbox
                inline
                label="Collapsible rows"
                checked={enableExpanding}
                onCheckedChange={(v) => setEnableExpanding(!!v)}
              />
              <Checkbox
                inline
                label="Hide/show columns"
                checked={enableColumnVisibility}
                onCheckedChange={(v) => setEnableColumnVisibility(!!v)}
              />
              <Checkbox
                inline
                label="Resizable columns"
                checked={enableColumnResizing}
                onCheckedChange={(v) => setEnableColumnResizing(!!v)}
              />
              <Checkbox
                inline
                label="Row actions"
                checked={enableRowActions}
                onCheckedChange={(v) => setEnableRowActions(!!v)}
              />
              <Checkbox
                inline
                label="Export actions"
                checked={enableExport}
                onCheckedChange={(v) => setEnableExport(!!v)}
              />
            </div>
          </Panel>

          <Panel title="Data Table - Employees">
            <DataTable
              columns={columns}
              data={advancedTableRows}
              pageSizeOptions={[5, 10, 25, 50]}
              searchPlaceholder="Search employees..."
              enablePagination={enablePagination}
              enableStriping={enableStriping}
              enableBordered={enableBordered}
              enableSorting={enableSorting}
              enableGlobalFilter={enableGlobalFilter}
              enableColumnFilters={enableColumnFilters}
              enableRowSelection={enableRowSelection}
              enableExpanding={enableExpanding}
              enableColumnVisibility={enableColumnVisibility}
              enableColumnResizing={enableColumnResizing}
              enableExport={enableExport}
              exportFileName="employees.csv"
              renderExpandedRow={(row) => (
                <div className="text-xs text-ca-text">
                  <span className="font-semibold text-ca-heading">Notes: </span>
                  {row.notes}
                </div>
              )}
            />
          </Panel>
        </div>
      </div>
    </>
  )
}

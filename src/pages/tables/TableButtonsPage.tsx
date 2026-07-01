import { createColumnHelper } from '@tanstack/react-table'
import { tableRows } from '../../data/tableData'
import type { TableRow } from '../../types'
import { Button, createSelectColumn, DataTable, PageHeader, Panel } from '../../components/ui'

const columnHelper = createColumnHelper<TableRow>()

const columns = [
  createSelectColumn<TableRow>(),
  columnHelper.accessor('engine', { header: 'Rendering engine' }),
  columnHelper.accessor('browser', { header: 'Browser' }),
  columnHelper.accessor('platform', { header: 'Platform(s)' }),
  columnHelper.accessor('version', { header: 'Engine version' }),
  columnHelper.accessor('grade', { header: 'CSS grade' }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <div className="flex gap-1">
        <Button variant="primary" size="xs">Edit</Button>
        <Button variant="danger" size="xs">Delete</Button>
      </div>
    ),
    enableSorting: false,
  }),
]

export default function TableButtonsPage() {
  return (
    <>
      <PageHeader
        title="Managed Tables - Buttons"
        subtitle="header small text goes here..."
        breadcrumb={[
          { label: 'Home', path: '/' },
          { label: 'Tables' },
          { label: 'Managed Tables' },
          { label: 'Buttons', active: true },
        ]}
      />

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5">
          <Panel title="Data Table - With Buttons & Selection">
            <DataTable
              columns={columns}
              data={tableRows}
              enableRowSelection
              enableSorting
            />
          </Panel>
        </div>
      </div>
    </>
  )
}

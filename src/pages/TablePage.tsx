import { createColumnHelper } from '@tanstack/react-table'
import { tableRows } from '../data/tableData'
import type { TableRow } from '../types'
import { DataTable, PageHeader, Panel } from '../components/ui'

const columnHelper = createColumnHelper<TableRow>()

const columns = [
  columnHelper.accessor('engine', { header: 'Rendering engine' }),
  columnHelper.accessor('browser', { header: 'Browser' }),
  columnHelper.accessor('platform', { header: 'Platform(s)' }),
  columnHelper.accessor('version', { header: 'Engine version' }),
  columnHelper.accessor('grade', { header: 'CSS grade' }),
]

export default function TablePage() {
  return (
    <>
      <PageHeader
        title="Managed Tables"
        subtitle="header small text goes here..."
        breadcrumb={[
          { label: 'Home', path: '/' },
          { label: 'Tables' },
          { label: 'Managed Tables', active: true },
        ]}
      />

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5">
          <Panel title="Data Table - Default">
            <DataTable columns={columns} data={tableRows} />
          </Panel>
        </div>
      </div>
    </>
  )
}

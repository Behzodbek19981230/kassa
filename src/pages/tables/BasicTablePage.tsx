import {
  Label,
  PageHeader,
  Panel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui'

const basicData = [
  { id: 1, first: 'Mark', last: 'Otto', username: '@mdo' },
  { id: 2, first: 'Jacob', last: 'Thornton', username: '@fat' },
  { id: 3, first: 'Larry', last: 'the Bird', username: '@twitter' },
]

const stripedData = [
  { col1: 'table cell example', col2: 'table cell example', col3: 'table cell example' },
  { col1: 'table cell example', col2: 'table cell example', col3: 'table cell example' },
  { col1: 'table cell example', col2: 'table cell example', col3: 'table cell example' },
  { col1: 'table cell example', col2: 'table cell example', col3: 'table cell example' },
]

export default function BasicTablePage() {
  return (
    <>
      <PageHeader
        title="Basic Tables"
        subtitle="header small text goes here..."
        breadcrumb={[
          { label: 'Home', path: '/' },
          { label: 'Tables' },
          { label: 'Basic Tables', active: true },
        ]}
      />

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5 lg:w-1/2">
          <Panel title="Basic Table">
            <Table className="border border-ca-border">
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Username</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {basicData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.first}</TableCell>
                    <TableCell>{row.last}</TableCell>
                    <TableCell>{row.username}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </div>

        <div className="w-full px-2.5 lg:w-1/2">
          <Panel title="Striped Rows">
            <Table className="border border-ca-border">
              <TableHeader>
                <TableRow>
                  <TableHead>Column 1</TableHead>
                  <TableHead>Column 2</TableHead>
                  <TableHead>Column 3</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stripedData.map((row, i) => (
                  <TableRow key={i} className={i % 2 === 0 ? 'bg-ca-table-stripe' : ''}>
                    <TableCell>{row.col1}</TableCell>
                    <TableCell>{row.col2}</TableCell>
                    <TableCell>{row.col3}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </div>

        <div className="w-full px-2.5">
          <Panel title="Table with Labels">
            <Table className="border border-ca-border">
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell><Label variant="success">Success</Label></TableCell>
                  <TableCell>Payment completed</TableCell>
                  <TableCell>$320.00</TableCell>
                </TableRow>
                <TableRow className="bg-ca-table-stripe">
                  <TableCell><Label variant="warning">Pending</Label></TableCell>
                  <TableCell>Awaiting confirmation</TableCell>
                  <TableCell>$150.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Label variant="danger">Failed</Label></TableCell>
                  <TableCell>Transaction declined</TableCell>
                  <TableCell>$89.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Panel>
        </div>
      </div>
    </>
  )
}

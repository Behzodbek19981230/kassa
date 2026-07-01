import { Label } from './Badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table'

export interface AnalyticsRow {
  label: string
  labelVariant: 'danger' | 'warning' | 'success' | 'primary' | 'default' | 'inverse'
  value: string
  trend?: 'up' | 'down' | null
}

interface AnalyticsTableProps {
  rows: AnalyticsRow[]
}

export function AnalyticsTable({ rows }: AnalyticsTableProps) {
  return (
    <Table className="mb-0">
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Trend</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell>
              <Label variant={row.labelVariant}>{row.label}</Label>
            </TableCell>
            <TableCell className="text-ca-heading">
              {row.value}
              {row.trend === 'up' && <span className="ml-1 text-ca-green">↑</span>}
              {row.trend === 'down' && <span className="ml-1 text-ca-red">↓</span>}
            </TableCell>
            <TableCell>
              <div className="h-5 w-16 rounded bg-ca-silver" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

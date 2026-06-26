import type { ReactNode } from 'react'

interface AdminDataTableProps {
  columns: string[]
  children: ReactNode
  emptyMessage?: string
  isEmpty?: boolean
  colSpan?: number
}

const AdminDataTable = ({
  columns,
  children,
  emptyMessage = 'No records found.',
  isEmpty = false,
  colSpan,
}: AdminDataTableProps) => (
  <div className="admin-table-wrap overflow-x-auto">
    <table className="admin-table w-full text-sm">
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column}
              className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500"
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {isEmpty ? (
          <tr>
            <td colSpan={colSpan ?? columns.length} className="px-5 py-12 text-center text-sm text-zinc-500">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          children
        )}
      </tbody>
    </table>
  </div>
)

export const AdminTableRow = ({ children }: { children: ReactNode }) => (
  <tr className="admin-table-row">{children}</tr>
)

export const AdminTableCell = ({
  children,
  accent,
  mono,
  muted,
  className = '',
}: {
  children: ReactNode
  accent?: boolean
  mono?: boolean
  muted?: boolean
  className?: string
}) => (
  <td
    className={`px-5 py-3.5 align-middle ${
      accent ? 'text-[#C5A073]' : muted ? 'text-zinc-400' : 'text-zinc-200'
    } ${mono ? 'font-mono text-[13px]' : ''} ${className}`}
  >
    {children}
  </td>
)

export const AdminStatusBadge = ({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'success' | 'danger' | 'neutral' | 'warning'
}) => {
  const toneClass =
    tone === 'danger'
      ? 'border-red-500/30 bg-red-950/40 text-red-300'
      : tone === 'success'
        ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
        : tone === 'warning'
          ? 'border-amber-500/30 bg-amber-950/40 text-amber-300'
          : 'border-zinc-600/40 bg-zinc-800/60 text-zinc-300'

  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-[12px] font-medium capitalize leading-none ${toneClass}`}>
      {children}
    </span>
  )
}

export default AdminDataTable

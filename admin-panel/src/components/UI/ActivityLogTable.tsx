import type { ReactNode } from 'react'
import type { ActivityLogEntry } from '../../services/guardApi'
import { formatDate } from '../../utils/formatDate'

interface ActivityLogTableProps {
  logs: ActivityLogEntry[]
  loading?: boolean
  emptyMessage?: string
  hideContext?: boolean
  hideIpAddress?: boolean
}

const formatEventLabel = (eventType: string) =>
  eventType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const formatRoleLabel = (role: string | null | undefined) => {
  if (!role) return ''
  if (role === 'admin') return 'admin'
  if (role === 'security' || role === 'guard') return 'security Guard'
  if (role === 'resident') return 'resident'
  return role
}

const formatContext = (context: Record<string, unknown> | null | undefined) => {
  if (!context || Object.keys(context).length === 0) return '—'
  return JSON.stringify(context)
}

const TableSkeleton = ({ hideContext, hideIpAddress }: { hideContext: boolean; hideIpAddress: boolean }) => {
  return (
    <div className="admin-table-wrap overflow-x-auto animate-pulse">
      <table className="admin-table w-full min-w-[960px] text-sm">
        <thead>
          <tr>
            <AdminTh>Time</AdminTh>
            <AdminTh>Event</AdminTh>
            <AdminTh>Identifier</AdminTh>
            <AdminTh>User</AdminTh>
            {!hideIpAddress && <AdminTh>IP Address</AdminTh>}
            {!hideContext && <AdminTh>Context</AdminTh>}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="admin-table-row border-b border-white/5">
              <td className="px-5 py-5"><div className="h-4 w-32 rounded bg-zinc-800" /></td>
              <td className="px-5 py-5"><div className="h-6 w-24 rounded bg-zinc-800" /></td>
              <td className="px-5 py-5"><div className="h-4 w-20 rounded bg-zinc-800" /></td>
              <td className="px-5 py-5"><div className="h-4 w-36 rounded bg-zinc-800" /></td>
              {!hideIpAddress && <td className="px-5 py-5"><div className="h-4 w-24 rounded bg-zinc-800" /></td>}
              {!hideContext && <td className="px-5 py-5"><div className="h-4 w-40 rounded bg-zinc-800" /></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const ActivityLogTable = ({
  logs,
  loading = false,
  emptyMessage = 'No activity logs found.',
  hideContext = false,
  hideIpAddress = false,
}: ActivityLogTableProps) => {
  if (loading) {
    return <TableSkeleton hideContext={hideContext} hideIpAddress={hideIpAddress} />
  }

  const colSpan = 6 - (hideContext ? 1 : 0) - (hideIpAddress ? 1 : 0)

  return (
    <div className="admin-table-wrap overflow-x-auto">
      <table className="admin-table w-full min-w-[960px] text-sm">
        <thead>
          <tr>
            <AdminTh>Time</AdminTh>
            <AdminTh>Event</AdminTh>
            <AdminTh>Identifier</AdminTh>
            <AdminTh>User</AdminTh>
            {!hideIpAddress && <AdminTh>IP Address</AdminTh>}
            {!hideContext && <AdminTh>Context</AdminTh>}
          </tr>
        </thead>
        <tbody>
          {logs.length > 0 ? (
            logs.map((log) => (
              <tr key={log.activity_log_id} className="admin-table-row">
                <AdminTd accent>{formatDate(log.created_at)}</AdminTd>
                <AdminTd>
                  <EventBadge eventType={log.event_type} />
                </AdminTd>
                <AdminTd mono>{log.username_attempted ?? '—'}</AdminTd>
                <AdminTd>
                  {log.user ? (
                    <span>
                      <span className="text-zinc-100">
                        {log.user.first_name} {log.user.last_name}
                      </span>{' '}
                      <span className="text-zinc-500">{formatRoleLabel(log.user.role)}</span>
                    </span>
                  ) : (
                    <span className="text-zinc-500">N/A</span>
                  )}
                </AdminTd>
                {!hideIpAddress && (
                  <AdminTd accent mono>
                    {log.ip_address ?? '—'}
                  </AdminTd>
                )}
                {!hideContext && (
                  <AdminTd mono muted>
                    {formatContext(log.context)}
                  </AdminTd>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={colSpan} className="px-5 py-12 text-center text-sm text-zinc-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const AdminTh = ({ children }: { children: string }) => (
  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
    {children}
  </th>
)

const AdminTd = ({
  children,
  accent,
  mono,
  muted,
}: {
  children: ReactNode
  accent?: boolean
  mono?: boolean
  muted?: boolean
}) => (
  <td
    className={`px-5 py-3.5 align-middle ${
      accent ? 'text-[#C5A073]' : muted ? 'text-zinc-400' : 'text-zinc-200'
    } ${mono ? 'font-mono text-[13px]' : ''}`}
  >
    {children}
  </td>
)

const EventBadge = ({ eventType }: { eventType: string }) => {
  const isFailure = eventType.includes('failure')
  const isSuccess = eventType.includes('success')

  const tone = isFailure
    ? 'border-red-500/30 bg-red-950/40 text-red-300'
    : isSuccess
      ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
      : 'border-zinc-600/40 bg-zinc-800/60 text-zinc-300'

  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-[12px] font-medium leading-none ${tone}`}>
      {formatEventLabel(eventType)}
    </span>
  )
}

export default ActivityLogTable

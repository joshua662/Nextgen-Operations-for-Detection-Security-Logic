import { useMemo, useState, type ReactNode } from 'react'
import { useGuardActivityLogs } from '../../hooks/useGuards'
import { formatDate } from '../../utils/formatDate'

const EVENT_OPTIONS = [
  { value: '', label: 'All guard events' },
  { value: 'admin_portal_login_success', label: 'Login (success)' },
  { value: 'admin_portal_login_failure', label: 'Login (failure)' },
  { value: 'logout', label: 'Logout' },
]

interface GuardActivityLogsProps {
  compact?: boolean
  title?: string
  userId?: number
}

const GuardActivityLogs = ({ compact = false, title = 'Guard Activity Logs', userId }: GuardActivityLogsProps) => {
  const [eventType, setEventType] = useState('')
  const [search, setSearch] = useState('')
  const { logs, loading } = useGuardActivityLogs({ event_type: eventType, search })

  const filtered = useMemo(() => {
    const guardEvents = logs.filter((log) =>
      ['admin_portal_login_success', 'admin_portal_login_failure', 'logout'].includes(log.event_type),
    )
    if (!userId) return guardEvents
    return guardEvents.filter((log) => log.user_id === userId)
  }, [logs, userId])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {!compact && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Security guard login and logout events from the client portal.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          placeholder="Search username or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          {EVENT_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading activity...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <Th>Time</Th>
                <Th>Event</Th>
                <Th>Guard</Th>
                <Th>Username</Th>
                <Th>IP</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
              {filtered.length > 0 ? (
                filtered.map((log) => (
                  <tr key={log.activity_log_id}>
                    <Td>{formatDate(log.created_at)}</Td>
                    <Td>
                      <Badge eventType={log.event_type} />
                    </Td>
                    <Td>
                      {log.user ? `${log.user.first_name} ${log.user.last_name}` : 'N/A'}
                    </Td>
                    <Td className="font-mono text-xs">{log.username_attempted ?? 'N/A'}</Td>
                    <Td className="font-mono text-xs">{log.ip_address ?? 'N/A'}</Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No guard activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const Th = ({ children }: { children: string }) => (
  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">{children}</th>
)

const Td = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <td className={`px-4 py-3 text-zinc-800 dark:text-zinc-200 ${className}`}>{children}</td>
)

const Badge = ({ eventType }: { eventType: string }) => {
  const isFailure = eventType.includes('failure')
  const isLogout = eventType === 'logout'
  const tone = isFailure
    ? 'bg-red-100 text-red-800'
    : isLogout
      ? 'bg-zinc-100 text-zinc-700'
      : 'bg-green-100 text-green-800'
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${tone}`}>
      {eventType.replaceAll('_', ' ')}
    </span>
  )
}

export default GuardActivityLogs

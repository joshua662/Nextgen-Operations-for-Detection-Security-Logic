import { useMemo, useState } from 'react'
import { useGuardActivityLogs } from '../../hooks/useGuards'
import ActivityLogTable from '../UI/ActivityLogTable'
import { AdminInput, AdminSectionTitle, AdminSelect } from '../UI/AdminPanelShell'

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
    <div className="space-y-5">
      {compact ? (
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      ) : (
        <AdminSectionTitle
          title={title}
          description="Security guard login and logout events from the client portal."
        />
      )}

      <div className="flex flex-wrap gap-3">
        <AdminInput
          className="min-w-[200px] flex-1"
          placeholder="Search username or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <AdminSelect value={eventType} onChange={(e) => setEventType(e.target.value)}>
          {EVENT_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </AdminSelect>
      </div>

      <ActivityLogTable
        logs={filtered}
        loading={loading}
        emptyMessage="No guard activity logs found."
      />
    </div>
  )
}

export default GuardActivityLogs

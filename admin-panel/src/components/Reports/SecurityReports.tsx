import { useMemo, useState } from 'react'
import { useSecurityActivityLogs } from '../../hooks/useReports'
import ActivityLogTable from '../UI/ActivityLogTable'
import { AdminInput, AdminSectionTitle, AdminStatCard } from '../UI/AdminPanelShell'

const SecurityReports = () => {
  const [search, setSearch] = useState('')
  const { logs, loading } = useSecurityActivityLogs({ search })

  const guardLogs = useMemo(
    () =>
      logs.filter((log) =>
        ['admin_portal_login_success', 'admin_portal_login_failure', 'logout'].includes(log.event_type),
      ),
    [logs],
  )

  const stats = useMemo(() => {
    return guardLogs.reduce(
      (acc, log) => ({
        total: acc.total + 1,
        successes: acc.successes + (log.event_type === 'admin_portal_login_success' ? 1 : 0),
        failures: acc.failures + (log.event_type === 'admin_portal_login_failure' ? 1 : 0),
        logouts: acc.logouts + (log.event_type === 'logout' ? 1 : 0),
      }),
      { total: 0, successes: 0, failures: 0, logouts: 0 },
    )
  }, [guardLogs])

  return (
    <div className="space-y-6">
      <AdminSectionTitle
        title="Security Reports"
        description="Summary of security guard portal authentication events."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <AdminStatCard label="Total Events" value={stats.total} />
        <AdminStatCard label="Successful Logins" value={stats.successes} tone="green" />
        <AdminStatCard label="Failed Logins" value={stats.failures} tone="red" />
        <AdminStatCard label="Logouts" value={stats.logouts} />
      </div>

      <AdminInput
        className="max-w-md"
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ActivityLogTable logs={guardLogs} loading={loading} emptyMessage="No security events found." />
    </div>
  )
}

export default SecurityReports

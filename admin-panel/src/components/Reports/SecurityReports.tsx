import { useMemo, useState } from 'react'
import { useSecurityActivityLogs } from '../../hooks/useReports'
import { formatDate } from '../../utils/formatDate'

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
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Security Reports</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Summary of security guard portal authentication events.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total Events" value={stats.total} />
        <Stat label="Successful Logins" value={stats.successes} tone="green" />
        <Stat label="Failed Logins" value={stats.failures} tone="red" />
        <Stat label="Logouts" value={stats.logouts} />
      </div>

      <input
        className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="text-sm text-zinc-500">Loading security report...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
              {guardLogs.map((log) => (
                <tr key={log.activity_log_id}>
                  <td className="px-4 py-3">{formatDate(log.created_at)}</td>
                  <td className="px-4 py-3 capitalize">{log.event_type.replaceAll('_', ' ')}</td>
                  <td className="px-4 py-3">
                    {log.user ? `${log.user.first_name} ${log.user.last_name}` : log.username_attempted ?? 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.ip_address ?? 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const Stat = ({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'red' }) => (
  <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
    <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
    <p
      className={`mt-2 text-2xl font-bold ${
        tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-green-600' : 'text-zinc-900 dark:text-zinc-100'
      }`}
    >
      {value}
    </p>
  </div>
)

export default SecurityReports

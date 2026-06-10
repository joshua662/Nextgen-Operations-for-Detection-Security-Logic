import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAuthApi } from '../../services/adminApi'
import { useGuardActivityLogs } from '../../hooks/useGuards'
import { formatDate } from '../../utils/formatDate'
import GuardActivityLogs from '../SecurityGuards/GuardActivityLogs'

interface OverviewStats {
  authorized_entries: number
  unauthorized_attempts: number
  total_residents: number
  pending_update_requests: number
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { logs } = useGuardActivityLogs({})

  useEffect(() => {
    adminAuthApi
      .dashboardOverview()
      .then((res) => setStats(res.data.stats ?? null))
      .finally(() => setLoading(false))
  }, [])

  const guardEvents = logs.filter((log) =>
    ['admin_portal_login_success', 'admin_portal_login_failure', 'logout'].includes(log.event_type),
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Monitor security guard portal login and logout activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Authorized Today" value={loading ? '—' : String(stats?.authorized_entries ?? 0)} />
        <StatCard label="Unauthorized Today" value={loading ? '—' : String(stats?.unauthorized_attempts ?? 0)} tone="red" />
        <StatCard label="Residents" value={loading ? '—' : String(stats?.total_residents ?? 0)} />
        <StatCard label="Pending Requests" value={loading ? '—' : String(stats?.pending_update_requests ?? 0)} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recent Guard Login / Logout</h2>
          <Link to="/guards" className="text-sm font-medium text-violet-600 hover:text-violet-500">
            View all guards →
          </Link>
        </div>
        {guardEvents.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent guard portal activity.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {guardEvents.slice(0, 6).map((log) => (
              <li key={log.activity_log_id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-medium capitalize text-zinc-800 dark:text-zinc-200">
                  {log.event_type.replaceAll('_', ' ')}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {log.user ? `${log.user.first_name} ${log.user.last_name}` : log.username_attempted ?? 'Unknown'}
                </span>
                <span className="text-xs text-zinc-500">{formatDate(log.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <GuardActivityLogs compact title="Security Guard Activity Monitor" />
    </div>
  )
}

const StatCard = ({ label, value, tone }: { label: string; value: string; tone?: 'red' }) => (
  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
    <p className={`mt-2 text-2xl font-bold ${tone === 'red' ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
      {value}
    </p>
  </div>
)

export default AdminDashboard

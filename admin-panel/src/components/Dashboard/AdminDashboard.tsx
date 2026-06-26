import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAuthApi } from '../../services/adminApi'
import { useGuardActivityLogs } from '../../hooks/useGuards'
import { formatDate } from '../../utils/formatDate'
import GuardActivityLogs from '../SecurityGuards/GuardActivityLogs'
import { AdminPanelCard, AdminPanelHeader, AdminStatCard } from '../UI/AdminPanelShell'

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
      <AdminPanelHeader
        title="Admin Dashboard"
        description="Monitor security guard portal login and logout activity."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <AdminStatCard label="Authorized Today" value={loading ? '—' : String(stats?.authorized_entries ?? 0)} />
        <AdminStatCard
          label="Unauthorized Today"
          value={loading ? '—' : String(stats?.unauthorized_attempts ?? 0)}
          tone="red"
        />
        <AdminStatCard label="Residents" value={loading ? '—' : String(stats?.total_residents ?? 0)} />
        <AdminStatCard label="Pending Requests" value={loading ? '—' : String(stats?.pending_update_requests ?? 0)} />
      </div>

      <AdminPanelCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Recent Guard Login / Logout</h2>
          <Link to="/guards" className="text-sm font-medium text-[#C5A073] hover:text-[#d4b589]">
            View all guards →
          </Link>
        </div>
        {guardEvents.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent guard portal activity.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {guardEvents.slice(0, 6).map((log) => (
              <li key={log.activity_log_id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-medium text-zinc-200">
                  {log.event_type
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </span>
                <span className="text-zinc-400">
                  {log.user ? `${log.user.first_name} ${log.user.last_name}` : log.username_attempted ?? 'Unknown'}
                </span>
                <span className="text-xs text-[#C5A073]">{formatDate(log.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminPanelCard>

      <AdminPanelCard className="p-6">
        <GuardActivityLogs compact title="Security Guard Activity Monitor" />
      </AdminPanelCard>
    </div>
  )
}

export default AdminDashboard

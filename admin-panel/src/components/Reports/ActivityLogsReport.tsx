import { useState } from 'react'
import { useSecurityActivityLogs } from '../../hooks/useReports'
import ActivityLogTable from '../UI/ActivityLogTable'
import { AdminInput, AdminSectionTitle, AdminSelect } from '../UI/AdminPanelShell'

const ActivityLogsReport = () => {
  const [eventType, setEventType] = useState('')
  const [search, setSearch] = useState('')
  const { logs, loading } = useSecurityActivityLogs({ event_type: eventType, search })

  return (
    <div className="space-y-5">
      <AdminSectionTitle
        title="Activity Logs"
        description="Authentication and portal activity across admin and security guard accounts."
      />

      <div className="flex flex-wrap gap-3">
        <AdminInput
          className="min-w-[220px] flex-1"
          placeholder="Search username, identifier, or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <AdminSelect value={eventType} onChange={(e) => setEventType(e.target.value)}>
          <option value="">All events</option>
          <option value="admin_portal_login_success">Admin Portal Login Success</option>
          <option value="admin_portal_login_failure">Admin Portal Login Failure</option>
          <option value="logout">Logout</option>
        </AdminSelect>
      </div>

      <ActivityLogTable logs={logs} loading={loading} hideIpAddress={true} hideContext={true} />
    </div>
  )
}

export default ActivityLogsReport

import { useState } from 'react'
import { useAccessLogs } from '../../hooks/useReports'
import { formatDate } from '../../utils/formatDate'
import AdminDataTable, { AdminStatusBadge, AdminTableCell, AdminTableRow } from '../UI/AdminDataTable'
import { AdminInput, AdminSectionTitle, AdminSelect } from '../UI/AdminPanelShell'

const AccessLogs = () => {
  const [search, setSearch] = useState('')
  const [direction, setDirection] = useState('')
  const [status, setStatus] = useState('')
  const { logs, loading } = useAccessLogs({ search, direction, status })

  return (
    <div className="space-y-5">
      <AdminSectionTitle title="Access Logs" description="Gate entry and exit records." />

      <div className="flex flex-wrap gap-3">
        <AdminInput
          className="min-w-[200px] flex-1"
          placeholder="Search plate or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <AdminSelect value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="">All directions</option>
          <option value="IN">Entry (IN)</option>
          <option value="OUT">Exit (OUT)</option>
        </AdminSelect>
        <AdminSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="authorized">Authorized</option>
          <option value="unauthorized">Unauthorized</option>
        </AdminSelect>
      </div>

      {loading ? (
        <p className="py-10 text-sm text-zinc-500">Loading access logs...</p>
      ) : (
        <AdminDataTable
          columns={['Time', 'Plate', 'Direction', 'Status']}
          isEmpty={logs.length === 0}
          emptyMessage="No access logs found."
        >
          {logs.map((log) => (
            <AdminTableRow key={log.gate_log_id}>
              <AdminTableCell accent>{formatDate(log.logged_at)}</AdminTableCell>
              <AdminTableCell mono>{log.plate_number}</AdminTableCell>
              <AdminTableCell>{log.direction}</AdminTableCell>
              <AdminTableCell>
                <AdminStatusBadge tone={log.status === 'authorized' ? 'success' : 'danger'}>
                  {log.status}
                </AdminStatusBadge>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminDataTable>
      )}
    </div>
  )
}

export default AccessLogs

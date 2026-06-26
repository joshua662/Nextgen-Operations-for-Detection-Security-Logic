import { useIncidentRequests } from '../../hooks/useReports'
import { formatDate } from '../../utils/formatDate'
import AdminDataTable, { AdminStatusBadge, AdminTableCell, AdminTableRow } from '../UI/AdminDataTable'
import { AdminSectionTitle } from '../UI/AdminPanelShell'

const IncidentReports = () => {
  const { requests, loading } = useIncidentRequests()

  return (
    <div className="space-y-5">
      <AdminSectionTitle
        title="Incident Reports"
        description="Resident update requests and guest access incidents pending review."
      />

      {loading ? (
        <p className="py-10 text-sm text-zinc-500">Loading incidents...</p>
      ) : (
        <AdminDataTable
          columns={['Submitted', 'Type', 'Status', 'Admin Notes']}
          isEmpty={requests.length === 0}
          emptyMessage="No incident reports found."
        >
          {requests.map((req) => {
            const row = req as {
              update_request_id: number
              created_at: string
              request_type?: string
              status: string
              admin_notes?: string | null
            }
            return (
              <AdminTableRow key={row.update_request_id}>
                <AdminTableCell accent>{formatDate(row.created_at)}</AdminTableCell>
                <AdminTableCell>{(row.request_type ?? 'profile').replaceAll('_', ' ')}</AdminTableCell>
                <AdminTableCell>
                  <AdminStatusBadge
                    tone={
                      row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'
                    }
                  >
                    {row.status}
                  </AdminStatusBadge>
                </AdminTableCell>
                <AdminTableCell muted>{row.admin_notes ?? '—'}</AdminTableCell>
              </AdminTableRow>
            )
          })}
        </AdminDataTable>
      )}
    </div>
  )
}

export default IncidentReports

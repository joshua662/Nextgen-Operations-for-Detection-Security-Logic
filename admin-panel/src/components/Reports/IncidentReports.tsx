import { useIncidentRequests } from '../../hooks/useReports'
import { formatDate } from '../../utils/formatDate'

const IncidentReports = () => {
  const { requests, loading } = useIncidentRequests()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Incident Reports</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Resident update requests and guest access incidents pending review.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading incidents...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Admin Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
              {requests.length > 0 ? (
                requests.map((req) => {
                  const row = req as {
                    update_request_id: number
                    created_at: string
                    request_type?: string
                    status: string
                    admin_notes?: string | null
                  }
                  return (
                    <tr key={row.update_request_id}>
                      <td className="px-4 py-3">{formatDate(row.created_at)}</td>
                      <td className="px-4 py-3 capitalize">{(row.request_type ?? 'profile').replaceAll('_', ' ')}</td>
                      <td className="px-4 py-3 capitalize">{row.status}</td>
                      <td className="px-4 py-3">{row.admin_notes ?? '—'}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No incident reports found.
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

export default IncidentReports

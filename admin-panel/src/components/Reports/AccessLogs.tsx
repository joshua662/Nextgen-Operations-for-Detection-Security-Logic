import { useState } from 'react'
import { useAccessLogs } from '../../hooks/useReports'
import { formatDate } from '../../utils/formatDate'

const AccessLogs = () => {
  const [search, setSearch] = useState('')
  const [direction, setDirection] = useState('')
  const [status, setStatus] = useState('')
  const { logs, loading } = useAccessLogs({ search, direction, status })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Access Logs</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Gate entry and exit records.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="Search plate or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
        >
          <option value="">All directions</option>
          <option value="IN">Entry (IN)</option>
          <option value="OUT">Exit (OUT)</option>
        </select>
        <select
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="authorized">Authorized</option>
          <option value="unauthorized">Unauthorized</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading access logs...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Plate</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Direction</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.gate_log_id}>
                    <td className="px-4 py-3">{formatDate(log.logged_at)}</td>
                    <td className="px-4 py-3 font-mono">{log.plate_number}</td>
                    <td className="px-4 py-3">{log.direction}</td>
                    <td className="px-4 py-3 capitalize">{log.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No access logs found.
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

export default AccessLogs

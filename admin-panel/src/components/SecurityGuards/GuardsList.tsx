import { useState } from 'react'
import { useGuards } from '../../hooks/useGuards'
import GuardDetailsModal from './GuardDetails'

const GuardsList = () => {
  const [search, setSearch] = useState('')
  const { guards, loading, error } = useGuards(search)
  const [selectedGuardId, setSelectedGuardId] = useState<number | null>(null)

  return (
    <div className="space-y-4 relative">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Security Guards</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Staff accounts registered as security guards on the client portal.
        </p>
      </div>

      <input
        className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading guards...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Username</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
              {guards.length > 0 ? (
                guards.map((guard) => (
                  <tr key={guard.user_id}>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {[guard.first_name, guard.middle_name, guard.last_name].filter(Boolean).join(' ')}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{guard.username}</td>
                    <td className="px-4 py-3">{guard.email ?? 'N/A'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedGuardId(guard.user_id)}
                        className="font-medium text-violet-600 hover:text-violet-500"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No security guards found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedGuardId !== null && (
        <GuardDetailsModal id={selectedGuardId} onClose={() => setSelectedGuardId(null)} />
      )}
    </div>
  )
}

export default GuardsList

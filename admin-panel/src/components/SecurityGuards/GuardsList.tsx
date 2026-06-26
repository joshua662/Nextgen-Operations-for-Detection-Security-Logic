import { useState } from 'react'
import { useGuards } from '../../hooks/useGuards'
import GuardDetailsModal from './GuardDetails'
import AdminDataTable, { AdminTableCell, AdminTableRow } from '../UI/AdminDataTable'
import { AdminInput, AdminSectionTitle } from '../UI/AdminPanelShell'

const GuardsList = () => {
  const [search, setSearch] = useState('')
  const { guards, loading, error } = useGuards(search)
  const [selectedGuardId, setSelectedGuardId] = useState<number | null>(null)

  return (
    <div className="relative space-y-5">
      <AdminSectionTitle
        title="Security Guards"
        description="Staff accounts registered as security guards on the client portal."
      />

      <AdminInput
        className="max-w-md"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading ? (
        <p className="py-10 text-sm text-zinc-500">Loading guards...</p>
      ) : (
        <AdminDataTable
          columns={['Name', 'Username', 'Email', 'Actions']}
          isEmpty={guards.length === 0}
          emptyMessage="No security guards found."
        >
          {guards.map((guard) => (
            <AdminTableRow key={guard.user_id}>
              <AdminTableCell>
                {[guard.first_name, guard.middle_name, guard.last_name].filter(Boolean).join(' ')}
              </AdminTableCell>
              <AdminTableCell mono>{guard.username}</AdminTableCell>
              <AdminTableCell muted>{guard.email ?? 'N/A'}</AdminTableCell>
              <AdminTableCell>
                <button
                  type="button"
                  onClick={() => setSelectedGuardId(guard.user_id)}
                  className="font-medium text-[#C5A073] hover:text-[#d4b589]"
                >
                  View details
                </button>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminDataTable>
      )}

      {selectedGuardId !== null && (
        <GuardDetailsModal id={selectedGuardId} onClose={() => setSelectedGuardId(null)} />
      )}
    </div>
  )
}

export default GuardsList

import { useState } from 'react'
import { useGuards } from '../../hooks/useGuards'
import GuardDetailsModal from './GuardDetails'
import AdminDataTable, { AdminTableCell, AdminTableRow } from '../UI/AdminDataTable'
import { AdminInput, AdminSectionTitle } from '../UI/AdminPanelShell'
import type { GuardUser } from '../../services/guardApi'

type StaffRole = 'security_guard' | 'resident'

const roleTabs: { value: StaffRole; label: string }[] = [
  { value: 'security_guard', label: 'Security Guards' },
  { value: 'resident', label: 'Residents' },
]

const roleLabel = (role: string) => (role === 'resident' ? 'Resident' : 'Security Guard')

const GuardsList = () => {
  const [search, setSearch] = useState('')
  const { guards, loading, error } = useGuards(search)
  const [selectedRole, setSelectedRole] = useState<StaffRole>('security_guard')
  const [selectedStaff, setSelectedStaff] = useState<GuardUser | null>(null)
  const staffUsers = guards.filter((user) => user.role === 'security_guard' || user.role === 'resident')
  const filteredStaff = staffUsers.filter((user) => user.role === selectedRole)
  const counts = {
    security_guard: staffUsers.filter((user) => user.role === 'security_guard').length,
    resident: staffUsers.filter((user) => user.role === 'resident').length,
  }

  return (
    <div className="relative space-y-5">
      <AdminSectionTitle
        title="Staff Users"
        description="Security guards and residents registered from the client portal."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AdminInput
          className="max-w-md"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="inline-flex w-full rounded-lg border border-white/10 bg-[#18181b] p-1 sm:w-auto">
          {roleTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedRole(tab.value)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                selectedRole === tab.value
                  ? 'bg-[#C5A073] text-zinc-950'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
              }`}
            >
              {tab.label}
              <span className="ml-2 rounded bg-black/15 px-1.5 py-0.5 text-xs">{counts[tab.value]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading ? (
        <p className="py-10 text-sm text-zinc-500">Loading staff users...</p>
      ) : (
        <AdminDataTable
          columns={['Name', 'Role', 'Username', 'Email', 'Actions']}
          isEmpty={filteredStaff.length === 0}
          emptyMessage={`No ${roleLabel(selectedRole).toLowerCase()} users found.`}
        >
          {filteredStaff.map((guard) => (
            <AdminTableRow key={guard.user_id}>
              <AdminTableCell>
                {[guard.first_name, guard.middle_name, guard.last_name].filter(Boolean).join(' ')}
              </AdminTableCell>
              <AdminTableCell muted>{roleLabel(guard.role)}</AdminTableCell>
              <AdminTableCell mono>{guard.username}</AdminTableCell>
              <AdminTableCell muted>{guard.email ?? 'N/A'}</AdminTableCell>
              <AdminTableCell>
                <button
                  type="button"
                  onClick={() => setSelectedStaff(guard)}
                  className="font-medium text-[#C5A073] hover:text-[#d4b589]"
                >
                  View details
                </button>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminDataTable>
      )}

      {selectedStaff !== null && (
        <GuardDetailsModal user={selectedStaff} onClose={() => setSelectedStaff(null)} />
      )}
    </div>
  )
}

export default GuardsList

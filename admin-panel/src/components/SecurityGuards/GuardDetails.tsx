import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { GuardUser } from '../../services/guardApi'
import { formatDateShort } from '../../utils/formatDate'
import GuardActivityLogs from './GuardActivityLogs'
import { MemberCardModal } from './MemberCard'

interface GuardDetailsProps {
  user: GuardUser
  onClose: () => void
}

const roleLabel = (role: string) => (role === 'resident' ? 'Resident' : 'Security Guard')

const userFullName = (user: GuardUser) =>
  [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ')

const GuardDetailsModal = ({ user, onClose }: GuardDetailsProps) => {
  const [cardOpen, setCardOpen] = useState(false)
  const isResident = user.role === 'resident'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div
        className="flex h-[min(92vh,960px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#18181b] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-6 sm:px-8">
          <h2 className="text-xl font-bold text-zinc-100 sm:text-2xl">{roleLabel(user.role)} Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
            aria-label="Close staff details"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">{userFullName(user)}</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  {roleLabel(user.role)} - @{user.username}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#1f1f23] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Member Card</p>
                    <p className="mt-2 text-sm text-zinc-300">Created by admin for this account role.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCardOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V4h12v5M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6v-7z" />
                    </svg>
                    Print
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Email" value={user.email ?? 'N/A'} />
              <Detail label="Username" value={user.username} />
              <Detail label="Date of Birth" value={formatDateShort(user.birth_date)} />
              <Detail label="Gender" value={user.gender?.gender ?? 'N/A'} />
              <Detail label="Contact Number" value={user.contact_number ?? 'N/A'} />
              <Detail label="Age" value={String(user.age ?? 'N/A')} />
              {isResident && (
                <>
                  <Detail label="Plate Number" value={user.plate_number ?? 'N/A'} />
                  <Detail label="Vehicle" value={[user.car_color, user.car_model].filter(Boolean).join(' ') || 'N/A'} />
                </>
              )}
            </div>

            <GuardActivityLogs userId={user.user_id} title={`Login / Logout History - ${user.first_name}`} />
          </div>
        </div>
      </div>

      <MemberCardModal isOpen={cardOpen} user={user} onClose={() => setCardOpen(false)} />
    </div>,
    document.body,
  )
}

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/10 bg-[#1f1f23] p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-zinc-100">{value}</p>
  </div>
)

export default GuardDetailsModal

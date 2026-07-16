import { useState } from 'react'
import { createPortal } from 'react-dom'
import { guardApi, type GuardUser } from '../../services/guardApi'
import { formatDateShort } from '../../utils/formatDate'
import GuardActivityLogs from './GuardActivityLogs'
import { MemberCardModal } from './MemberCard'

interface GuardDetailsProps {
  user: GuardUser
  onClose: () => void
  onUpdate?: () => void
}

const roleLabel = (role: string) => (role === 'resident' ? 'Resident' : 'Security Guard')

const userFullName = (user: GuardUser) =>
  [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ')

const LockIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const ShieldCheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const RfidSection = ({ user, onUpdate }: { user: GuardUser; onUpdate?: () => void }) => {
  const [rfidInput, setRfidInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedUid, setSavedUid] = useState(user.rfid_card_uid ?? '')
  const isLocked = !!savedUid

  const handleSave = async () => {
    const trimmed = rfidInput.trim()
    if (!trimmed) {
      setError('Please enter an RFID UID.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await guardApi.updateResidentRfid(user.user_id, trimmed)
      setSavedUid(res.data.resident.rfid_card_uid ?? trimmed)
      setRfidInput('')
      onUpdate?.()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Failed to save RFID UID.')
    } finally {
      setSaving(false)
    }
  }

  if (isLocked) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <ShieldCheckIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">RFID UID</p>
            <p className="mt-1 font-mono text-sm font-semibold text-emerald-300">{savedUid}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-400">
            <LockIcon />
            Permanently Assigned
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Assign RFID UID</p>
      <p className="mt-1 text-sm text-zinc-400">
        Enter the RFID card UID for this resident. Once assigned, it <strong className="text-amber-400">cannot be changed</strong>.
      </p>
      <div className="mt-4 flex gap-3">
        <input
          type="text"
          value={rfidInput}
          onChange={(e) => { setRfidInput(e.target.value); setError('') }}
          placeholder="e.g. A3 B2 C1 D0"
          maxLength={50}
          className="flex-1 rounded-lg border border-white/10 bg-[#121212] px-4 py-2.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-[#C5A073] focus:ring-1 focus:ring-[#C5A073]/40"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !rfidInput.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#C5A073] px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-[#d4b589] disabled:opacity-50"
        >
          {saving ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : 'Assign RFID'}
        </button>
      </div>
      {error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
    </div>
  )
}

const GuardDetailsModal = ({ user, onClose, onUpdate }: GuardDetailsProps) => {
  const [cardOpen, setCardOpen] = useState(false)
  const isResident = user.role === 'resident'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md sm:p-6" onClick={onClose}>
      <div
        className="flex h-[min(92vh,960px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#18181e]/80 backdrop-blur-xl shadow-2xl"
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

              <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
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

            {isResident && <RfidSection user={user} onUpdate={onUpdate} />}

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
  <div className="rounded-lg border border-white/5 bg-black/25 p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-zinc-100">{value}</p>
  </div>
)

export default GuardDetailsModal

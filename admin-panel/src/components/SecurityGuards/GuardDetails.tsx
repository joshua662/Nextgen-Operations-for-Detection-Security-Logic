import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { guardApi, type GuardUser } from '../../services/guardApi'
import { formatDateShort } from '../../utils/formatDate'
import GuardActivityLogs from './GuardActivityLogs'

interface GuardDetailsProps {
  id: number
  onClose: () => void
}

const GuardDetailsModal = ({ id, onClose }: GuardDetailsProps) => {
  const [guard, setGuard] = useState<GuardUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    guardApi
      .loadGuards(1)
      .then((res) => {
        const found = (res.data.users?.data ?? []).find((u) => u.user_id === id)
        setGuard(found ?? null)
      })
      .finally(() => setLoading(false))
  }, [id])

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="flex h-[min(92vh,960px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#18181b] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-6 sm:px-8">
          <h2 className="text-xl font-bold text-zinc-100 sm:text-2xl">Guard Details</h2>
          <button 
            type="button" 
            onClick={onClose}
            className="-mr-2 rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
            aria-label="Close guard details"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading guard details...</p>
          ) : !guard ? (
            <p className="text-sm text-red-400">Security guard not found.</p>
          ) : (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
                  {[guard.first_name, guard.middle_name, guard.last_name].filter(Boolean).join(' ')}
                </h1>
                <p className="mt-1 text-sm text-zinc-500">Security Guard · @{guard.username}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Detail label="Email" value={guard.email ?? 'N/A'} />
                <Detail label="Username" value={guard.username} />
                <Detail label="Date of Birth" value={formatDateShort(guard.birth_date)} />
                <Detail label="Gender" value={guard.gender?.gender ?? 'N/A'} />
              </div>

              <GuardActivityLogs userId={guard.user_id} title={`Login / Logout History — ${guard.first_name}`} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/10 bg-[#1f1f23] p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-zinc-100">{value}</p>
  </div>
)

export default GuardDetailsModal

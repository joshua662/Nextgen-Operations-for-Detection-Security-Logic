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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Guard Details</h2>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading guard details...</p>
          ) : !guard ? (
            <p className="text-sm text-red-600">Security guard not found.</p>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {[guard.first_name, guard.middle_name, guard.last_name].filter(Boolean).join(' ')}
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Security Guard · @{guard.username}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Detail label="Email" value={guard.email ?? 'N/A'} />
                <Detail label="Username" value={guard.username} />
                <Detail label="Date of Birth" value={formatDateShort(guard.birth_date)} />
                <Detail label="Gender" value={guard.gender?.gender ?? 'N/A'} />
              </div>

              <GuardActivityLogs userId={guard.user_id} title={`Login / Logout History — ${guard.first_name}`} />
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
  </div>
)

export default GuardDetailsModal

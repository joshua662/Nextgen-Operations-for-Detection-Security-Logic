import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { guardApi, type GuardUser } from '../../services/guardApi'
import { formatDateShort } from '../../utils/formatDate'
import GuardActivityLogs from './GuardActivityLogs'

const GuardDetails = () => {
  const { id } = useParams<{ id: string }>()
  const [guard, setGuard] = useState<GuardUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    guardApi
      .loadGuards(1)
      .then((res) => {
        const found = (res.data.users?.data ?? []).find((u) => u.user_id === Number(id))
        setGuard(found ?? null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-sm text-zinc-500">Loading guard details...</p>
  if (!guard) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Security guard not found.</p>
        <Link to="/guards" className="text-sm font-medium text-violet-600 hover:text-violet-500">
          ← Back to guards
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/guards" className="text-sm font-medium text-violet-600 hover:text-violet-500">
          ← Back to guards
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {[guard.first_name, guard.middle_name, guard.last_name].filter(Boolean).join(' ')}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Security Guard · @{guard.username}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Detail label="Email" value={guard.email ?? 'N/A'} />
        <Detail label="Username" value={guard.username} />
        <Detail label="Date of Birth" value={formatDateShort(guard.birth_date)} />
        <Detail label="Gender" value={guard.gender?.gender ?? 'N/A'} />
      </div>

      <GuardActivityLogs userId={guard.user_id} title={`Login / Logout History — ${guard.first_name}`} />
    </div>
  )
}

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
  </div>
)

export default GuardDetails

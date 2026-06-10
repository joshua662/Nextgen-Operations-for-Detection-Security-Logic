import { useCallback, useEffect, useState } from 'react'
import { guardApi, type ActivityLogEntry, type GuardUser } from '../services/guardApi'

export const useGuards = (search = '') => {
  const [guards, setGuards] = useState<GuardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    guardApi
      .loadGuards(1, search)
      .then((res) => setGuards(res.data.users?.data ?? []))
      .catch(() => setError('Failed to load security guards.'))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => {
    const handle = window.setTimeout(refresh, 200)
    return () => window.clearTimeout(handle)
  }, [refresh])

  return { guards, loading, error, refresh }
}

export const useGuardActivityLogs = (
  filters: { event_type?: string; search?: string } = {},
) => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const handle = window.setTimeout(() => {
      guardApi
        .loadGuardActivityLogs(1, filters)
        .then((res) => setLogs(res.data.logs?.data ?? []))
        .finally(() => setLoading(false))
    }, 200)
    return () => window.clearTimeout(handle)
  }, [filters.event_type, filters.search])

  return { logs, loading }
}

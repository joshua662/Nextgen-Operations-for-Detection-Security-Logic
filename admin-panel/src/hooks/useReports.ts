import { useEffect, useState } from 'react'
import { reportApi, type GateLogEntry } from '../services/reportApi'
import type { ActivityLogEntry } from '../services/guardApi'

export const useAccessLogs = (filters: { direction?: string; status?: string; search?: string } = {}) => {
  const [logs, setLogs] = useState<GateLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const handle = window.setTimeout(() => {
      reportApi
        .loadAccessLogs(1, filters)
        .then((res) => setLogs(res.data.logs?.data ?? []))
        .finally(() => setLoading(false))
    }, 200)
    return () => window.clearTimeout(handle)
  }, [filters.direction, filters.status, filters.search]) // eslint-disable-line react-hooks/exhaustive-deps

  return { logs, loading }
}

export const useSecurityActivityLogs = (filters: { event_type?: string; search?: string } = {}) => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const handle = window.setTimeout(() => {
      reportApi
        .loadActivityLogs(1, filters)
        .then((res) => setLogs(res.data.logs?.data ?? []))
        .finally(() => setLoading(false))
    }, 200)
    return () => window.clearTimeout(handle)
  }, [filters.event_type, filters.search]) // eslint-disable-line react-hooks/exhaustive-deps

  return { logs, loading }
}

export const useIncidentRequests = () => {
  const [requests, setRequests] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportApi
      .loadUpdateRequests(1)
      .then((res) => setRequests(res.data.requests?.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  return { requests, loading }
}

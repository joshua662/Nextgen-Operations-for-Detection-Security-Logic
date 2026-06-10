import adminApi from './adminApi'

export interface GateLogEntry {
  gate_log_id: number
  plate_number: string
  direction: string
  status: string
  logged_at: string
  user?: { first_name: string; last_name: string } | null
}

export const reportApi = {
  loadAccessLogs: (
    page = 1,
    filters: { direction?: string; status?: string; search?: string } = {},
  ) => {
    const params = new URLSearchParams({ page: String(page) })
    if (filters.direction) params.append('direction', filters.direction)
    if (filters.status) params.append('status', filters.status)
    if (filters.search) params.append('search', filters.search)
    return adminApi.get<{ logs: { data: GateLogEntry[] } }>(
      `/gate-log/loadGateLogs?${params}`,
    )
  },

  loadActivityLogs: (
    page = 1,
    filters: { event_type?: string; search?: string } = {},
  ) => {
    const params = new URLSearchParams({ page: String(page) })
    if (filters.event_type) params.append('event_type', filters.event_type)
    if (filters.search) params.append('search', filters.search)
    return adminApi.get(`/activity-log/loadActivityLogs?${params}`)
  },

  loadUpdateRequests: (page = 1, status?: string) => {
    const q = status ? `&status=${status}` : ''
    return adminApi.get(`/update-request/loadRequests?page=${page}${q}`)
  },
}

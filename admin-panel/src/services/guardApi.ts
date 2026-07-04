import adminApi from './adminApi'

export interface GuardUser {
  user_id: number
  username: string
  first_name: string
  last_name: string
  middle_name?: string | null
  email?: string | null
  contact_number?: string | null
  address?: string | null
  plate_number?: string | null
  car_model?: string | null
  car_color?: string | null
  rfid_card_uid?: string | null
  role: string
  birth_date?: string
  age?: string | number | null
  gender?: { gender_id: number; gender: string } | null
}

export interface ActivityLogEntry {
  activity_log_id: number
  user_id: number | null
  username_attempted: string | null
  event_type: string
  ip_address: string | null
  context: Record<string, unknown> | null
  created_at: string
  user?: {
    user_id: number
    first_name: string
    last_name: string
    role: string | null
    username: string | null
  } | null
}

export const guardApi = {
  loadGuards: (page = 1, search = '') => {
    const q = search ? `&search=${encodeURIComponent(search)}` : ''
    return adminApi.get<{ users: { data: GuardUser[] } }>(`/user/loadUsers?page=${page}${q}`)
  },

  loadMemberCardQr: (userId: number) =>
    adminApi.get<{ qr_code: string }>(`/user/memberCardQr/${userId}`),

  updateResidentRfid: (userId: number, rfid_card_uid: string) =>
    adminApi.put<{ message: string; resident: GuardUser }>(
      `/resident/updateRfid/${userId}`,
      { rfid_card_uid },
    ),

  loadGuardActivityLogs: (
    page = 1,
    filters: { event_type?: string; search?: string; user_id?: number } = {},
  ) => {
    const params = new URLSearchParams({ page: String(page) })
    if (filters.event_type) params.append('event_type', filters.event_type)
    if (filters.search) params.append('search', filters.search)
    return adminApi.get<{ logs: { data: ActivityLogEntry[] } }>(
      `/activity-log/loadActivityLogs?${params}`,
    )
  },
}

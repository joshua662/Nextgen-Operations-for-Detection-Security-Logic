import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

const adminApi = axios.create({ baseURL: API_BASE })

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

export interface AdminUser {
  user_id: number
  username: string
  first_name: string
  last_name: string
  middle_name?: string | null
  email?: string | null
  role: string
}

export interface LoginResponse {
  user: AdminUser
  token: string
}

export const adminAuthApi = {
  login: (username: string, password: string) =>
    adminApi.post<LoginResponse>('/auth/admin/login', { username, password }),

  logout: () => adminApi.post('/auth/logout'),

  me: () => adminApi.get<{ user: AdminUser }>('/auth/me'),

  register: (data: {
    first_name: string
    middle_name?: string
    last_name: string
    gender: string
    birth_date: string
    email: string
  }) => adminApi.post('/auth/admin/register', data),

  dashboardOverview: () => adminApi.get('/dashboard/overview'),

  loadGenders: () => adminApi.get('/gender/publicGenders'),
}

export default adminApi

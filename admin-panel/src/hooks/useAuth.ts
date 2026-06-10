import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { adminAuthApi, type AdminUser } from '../services/adminApi'

interface AuthContextValue {
  user: AdminUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: {
    first_name: string
    middle_name?: string
    last_name: string
    gender: string
    birth_date: string
    email: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      setLoading(false)
      return
    }
    adminAuthApi
      .me()
      .then((res) => {
        if (res.data.user?.role === 'admin') {
          setUser(res.data.user)
        } else {
          localStorage.removeItem('admin_token')
        }
      })
      .catch(() => localStorage.removeItem('admin_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await adminAuthApi.login(username.trim(), password)
    if (res.data.user?.role !== 'admin') {
      localStorage.removeItem('admin_token')
      throw new Error('Only administrator accounts can access this portal.')
    }
    localStorage.setItem('admin_token', res.data.token)
    setUser(res.data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await adminAuthApi.logout()
    } finally {
      localStorage.removeItem('admin_token')
      setUser(null)
    }
  }, [])

  const register = useCallback(
    async (data: {
      first_name: string
      middle_name?: string
      last_name: string
      gender: string
      birth_date: string
      email: string
    }) => {
      await adminAuthApi.register(data)
    },
    [],
  )

  const value = useMemo(
    () => ({ user, loading, login, logout, register }),
    [user, loading, login, logout, register],
  )

  return createElement(AuthContext.Provider, { value }, children)
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

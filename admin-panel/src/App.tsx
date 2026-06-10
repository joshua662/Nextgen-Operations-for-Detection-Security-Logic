import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import AdminLogin from './components/Auth/AdminLogin'
import AdminLogout from './components/Auth/AdminLogout'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AdminPage from './pages/AdminPage'
import GuardsPage from './pages/GuardsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white'
      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
  }`

import { useState } from 'react'

const ProtectedLayout = () => {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500">Loading admin portal...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const closeSidebar = () => {
    if (sidebarOpen && window.innerWidth < 1024) setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-800">
      {/* Mobile header */}
      <header className="fixed top-0 z-50 flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 lg:hidden dark:border-zinc-700 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800"
          aria-label="Toggle sidebar"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <p className="font-bold text-zinc-900 dark:text-zinc-100">Admin Panel</p>
        <div className="w-10"></div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-zinc-200 bg-zinc-50 transition-transform dark:border-zinc-700 dark:bg-zinc-900 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-14 items-center justify-center border-b border-zinc-200 px-4 dark:border-zinc-700">
          <p className="font-bold text-zinc-900 dark:text-zinc-100">NextGen Admin</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Admin Portal
          </p>
          <ul className="space-y-1">
            <li>
              <NavLink to="/" end onClick={closeSidebar} className={navLinkClass}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/guards" onClick={closeSidebar} className={navLinkClass}>
                Security Guards
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports" onClick={closeSidebar} className={navLinkClass}>
                Reports
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings" onClick={closeSidebar} className={navLinkClass}>
                Settings
              </NavLink>
            </li>
          </ul>
        </div>
        
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-700">
          <div className="mb-3 px-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
          <AdminLogout />
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-screen pt-14 lg:ml-64 lg:pt-0">
        <div className="flex h-full w-full flex-1 flex-col gap-4 p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<AdminLogin />} />
    <Route element={<ProtectedLayout />}>
      <Route index element={<AdminPage />} />
      <Route path="guards/*" element={<GuardsPage />} />
      <Route path="reports/*" element={<ReportsPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
)

export default App

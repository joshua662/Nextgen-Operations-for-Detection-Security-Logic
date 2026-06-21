import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import AdminLogin from './components/Auth/AdminLogin'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AdminPage from './pages/AdminPage'
import GuardsPage from './pages/GuardsPage'
import NotificationsPage from './pages/NotificationsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import { useState } from 'react'
import AdminProfileModal from './components/Profile/AdminProfileModal'

const HomeIcon = () => (
  <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const ChartBarIcon = () => (
  <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const BellIcon = () => (
  <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const UsersIcon = () => (
  <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const TagIcon = () => (
  <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

const ChevronUpDownIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
  </svg>
)

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3.5 rounded-[10px] px-3.5 py-3 text-[14.5px] font-medium transition-colors ${
    isActive
      ? 'bg-[#3c3c3c] text-white'
      : 'text-zinc-300 hover:bg-[#2a2a2a] hover:text-white'
  }`

const ProtectedLayout = () => {
  const { user, loading, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()

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

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout()
      navigate('/login', { replace: true })
    }
  }

  const userInitials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'A'
  const userName = `${user.last_name}, ${user.first_name}`

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-800">
      {/* Mobile header */}
      <header className="fixed top-0 z-50 flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 lg:hidden dark:border-zinc-700 dark:bg-[#18181b]">
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
        <p className="font-bold text-zinc-900 dark:text-zinc-100">Gate Security</p>
        <div className="w-10"></div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar - Dark Theme matching screenshot */}
      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen w-[260px] flex-col bg-[#18181b] transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-[76px] items-center px-6 border-b border-white/5">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-white text-lg font-extrabold text-black">
            G
          </div>
          <span className="ml-3.5 text-lg font-bold text-white tracking-wide">Gate Security</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-2 text-[12.5px] font-bold uppercase tracking-widest text-zinc-500">
            Platform
          </p>
          <ul className="space-y-1.5">
            <li>
              <NavLink to="/" end onClick={closeSidebar} className={navLinkClass}>
                <HomeIcon />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports" onClick={closeSidebar} className={navLinkClass}>
                <ChartBarIcon />
                Activity Logs
              </NavLink>
            </li>
            <li>
              <NavLink to="/notifications" onClick={closeSidebar} className={navLinkClass}>
                <BellIcon />
                Notifications
              </NavLink>
            </li>
            <li>
              <NavLink to="/guards" onClick={closeSidebar} className={navLinkClass}>
                <UsersIcon />
                Staff Users
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings" onClick={closeSidebar} className={navLinkClass}>
                <TagIcon />
                Genders
              </NavLink>
            </li>
          </ul>
        </div>
        
        <div className="border-t border-white/5 p-4">
          <button 
            type="button"
            onClick={() => setProfileOpen(true)}
            title="Click to view profile"
            className="flex w-full items-center gap-3.5 rounded-xl p-2.5 text-left transition hover:bg-[#2a2a2a]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#333333] text-sm font-bold tracking-wider text-white">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-white">{userName}</p>
              <p className="truncate text-[13px] text-zinc-400">{user.email || 'admin@pdp.com'}</p>
            </div>
            <div className="text-zinc-400">
              <ChevronUpDownIcon />
            </div>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-screen pt-14 lg:ml-[260px] lg:pt-0">
        <div className="flex h-full w-full flex-1 flex-col gap-4 p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      <AdminProfileModal 
        isOpen={profileOpen} 
        onClose={() => setProfileOpen(false)} 
        user={user} 
        onLogout={handleLogout} 
      />
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
      <Route path="notifications" element={<NotificationsPage />} />
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

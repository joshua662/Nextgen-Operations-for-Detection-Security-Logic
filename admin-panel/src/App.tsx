import { Navigate, NavLink, Outlet, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import AdminLogin from './components/Auth/AdminLogin'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AdminPage from './pages/AdminPage'
import GuardsPage from './pages/GuardsPage'
import NotificationsPage from './pages/NotificationsPage'
import ReportsPage from './pages/ReportsPage'
import { useEffect, useState } from 'react'
import AdminProfileModal from './components/Profile/AdminProfileModal'
import SidebarHoverLabel from './components/Sidebar/SidebarHoverLabel'
import { usePersistedSidebarCollapsed } from './hooks/usePersistedSidebarCollapsed'
import { adminNotificationsApi } from './services/adminApi'
import PortalSkeleton from './components/Skeleton/PortalSkeleton'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'gate-admin-sidebar-collapsed'

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

const ChevronUpDownIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
  </svg>
)

const navLinkClass = (isCollapsed: boolean) => ({ isActive }: { isActive: boolean }) =>
  `flex items-center transition-all duration-300 ease-in-out ${
    isCollapsed ? 'px-3.5 py-2.5 gap-0' : 'px-3.5 py-2.5 gap-3.5'
  } rounded-[10px] text-[14.5px] font-medium ${
    isActive
      ? 'bg-[#3c3c3c] text-white shadow-inner'
      : 'text-zinc-300 hover:bg-[#2a2a2a] hover:text-white'
  }`

const ProtectedLayout = () => {
  const { user, loading, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { isCollapsed, toggleCollapsed } = usePersistedSidebarCollapsed(SIDEBAR_COLLAPSED_STORAGE_KEY)
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const loadUnreadCount = () => {
      adminNotificationsApi.getNotifications()
        .then((res) => {
          const list = Array.isArray(res.data.notifications)
            ? res.data.notifications
            : (res.data.notifications as any).data ?? []
          const unread = list.filter((n: any) => !n.is_read).length
          setUnreadCount(unread)
        })
        .catch(() => {})
    }

    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 15000)
    window.addEventListener('notifications_updated', loadUnreadCount)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('notifications_updated', loadUnreadCount)
    }
  }, [user])

  if (loading) {
    return <PortalSkeleton />
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
    <div className="min-h-screen bg-[#121212]">
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

      {/* Sidebar - Collapsible Dark Grey Theme */}
      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen flex-col bg-[#18181b] transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isCollapsed ? 'w-[76px] overflow-visible' : 'w-[260px]'}`}
      >
        <div className="hidden border-b border-white/5 p-4 lg:flex items-center h-[76px] shrink-0">
          <SidebarHoverLabel label="Gate Security" isCollapsed={isCollapsed} variant="dark" className="w-full">
            <button
              onClick={toggleCollapsed}
              className={`flex items-center focus:outline-none cursor-pointer transition-all duration-300 ease-in-out ${
                isCollapsed ? 'justify-center w-full gap-0' : 'gap-3.5'
              }`}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-white text-lg font-extrabold text-black shadow-md">
                G
              </div>
              <span className={`truncate font-bold text-white text-lg tracking-wide text-start transition-all duration-300 ease-in-out origin-left ${
                isCollapsed ? 'w-0 opacity-0 scale-90 pointer-events-none ml-0' : 'w-auto opacity-100 scale-100 ml-2.5'
              }`}>
                Gate Security
              </span>
            </button>
          </SidebarHoverLabel>
        </div>

        <div className={`flex-1 py-6 transition-all duration-300 ${isCollapsed ? 'overflow-visible px-2' : 'overflow-y-auto px-4'}`}>
          <div className="relative overflow-hidden h-6 mb-4">
            <p className={`absolute left-2 text-[12.5px] font-bold uppercase tracking-widest text-zinc-500 transition-all duration-300 ease-in-out origin-left ${
              isCollapsed ? 'opacity-0 scale-90 pointer-events-none translate-x-[-10px]' : 'opacity-100 scale-100 translate-x-0'
            }`}>
              Platform
            </p>
            <div className={`absolute inset-x-2 bottom-2 border-b border-white/5 transition-all duration-300 ease-in-out ${
              isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
            }`} />
          </div>
          <ul className="space-y-1.5">
            <li>
              <SidebarHoverLabel label="Dashboard" isCollapsed={isCollapsed} variant="dark">
                <NavLink to="/" end onClick={closeSidebar} className={navLinkClass(isCollapsed)}>
                  <span className="shrink-0 h-5 w-5 flex items-center justify-center">
                    <HomeIcon />
                  </span>
                  <span className={`transition-all duration-300 ease-in-out origin-left truncate ${
                    isCollapsed ? 'w-0 opacity-0 scale-90 pointer-events-none' : 'w-auto opacity-100 scale-100'
                  }`}>
                    Dashboard
                  </span>
                </NavLink>
              </SidebarHoverLabel>
            </li>
            <li>
              <SidebarHoverLabel label="Activity Logs" isCollapsed={isCollapsed} variant="dark">
                <NavLink to="/reports" onClick={closeSidebar} className={navLinkClass(isCollapsed)}>
                  <span className="shrink-0 h-5 w-5 flex items-center justify-center">
                    <ChartBarIcon />
                  </span>
                  <span className={`transition-all duration-300 ease-in-out origin-left truncate ${
                    isCollapsed ? 'w-0 opacity-0 scale-90 pointer-events-none' : 'w-auto opacity-100 scale-100'
                  }`}>
                    Activity Logs
                  </span>
                </NavLink>
              </SidebarHoverLabel>
            </li>
            <li>
              <SidebarHoverLabel label="Notifications" isCollapsed={isCollapsed} variant="dark">
                <NavLink to="/notifications" onClick={closeSidebar} className={navLinkClass(isCollapsed)}>
                  <span className="shrink-0 h-5 w-5 flex items-center justify-center relative">
                    <BellIcon />
                    <span className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#18181b] transition-all duration-300 ease-in-out ${
                      isCollapsed && unreadCount > 0 ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
                    }`}>
                      {unreadCount}
                    </span>
                  </span>
                  <div className={`flex items-center justify-between w-full transition-all duration-300 ease-in-out origin-left truncate ${
                    isCollapsed ? 'w-0 opacity-0 scale-90 pointer-events-none' : 'w-auto opacity-100 scale-100'
                  }`}>
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white shadow-sm ml-2">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </NavLink>
              </SidebarHoverLabel>
            </li>
            <li>
              <SidebarHoverLabel label="Staff Users" isCollapsed={isCollapsed} variant="dark">
                <NavLink to="/guards" onClick={closeSidebar} className={navLinkClass(isCollapsed)}>
                  <span className="shrink-0 h-5 w-5 flex items-center justify-center">
                    <UsersIcon />
                  </span>
                  <span className={`transition-all duration-300 ease-in-out origin-left truncate ${
                    isCollapsed ? 'w-0 opacity-0 scale-90 pointer-events-none' : 'w-auto opacity-100 scale-100'
                  }`}>
                    Staff Users
                  </span>
                </NavLink>
              </SidebarHoverLabel>
            </li>
          </ul>
        </div>
        
        <div className={`border-t border-white/5 transition-all duration-300 ${isCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
          <SidebarHoverLabel label={userName} isCollapsed={isCollapsed} variant="dark" className={isCollapsed ? 'flex justify-center' : 'w-full'}>
            <button 
              type="button"
              onClick={() => setProfileOpen(true)}
              className={`flex items-center transition-all duration-300 ease-in-out hover:bg-[#2a2a2a] cursor-pointer w-full rounded-xl ${
                isCollapsed ? 'p-1 gap-0' : 'p-2.5 gap-3.5'
              }`}
              aria-label={isCollapsed ? userName : 'Click to view profile'}
            >
              <div className={`flex shrink-0 items-center justify-center text-sm font-bold text-white rounded-xl bg-zinc-800 transition-all duration-300 ease-in-out ${
                isCollapsed ? 'h-10 w-10 tracking-normal' : 'h-11 w-11 tracking-wider'
              }`}>
                {userInitials}
              </div>
              <div className={`flex flex-1 items-center justify-between min-w-0 transition-all duration-300 ease-in-out origin-left truncate ${
                isCollapsed ? 'w-0 opacity-0 scale-90 pointer-events-none' : 'w-auto opacity-100 scale-100'
              }`}>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[14px] font-bold text-white">{userName}</p>
                  <p className="truncate text-[13px] text-zinc-400">{user.email || 'admin@pdp.com'}</p>
                </div>
                <div className="text-zinc-400 ml-2">
                  <ChevronUpDownIcon />
                </div>
              </div>
            </button>
          </SidebarHoverLabel>
        </div>
      </aside>

      {/* Main content */}
      <main className={`min-h-screen bg-[#121212] pt-14 lg:pt-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[260px]'}`}>
        <div key={location.pathname} className="flex h-full w-full flex-1 flex-col gap-4 p-4 lg:p-8 animate-fade-in-up">
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

import { type AdminUser } from "../../services/adminApi"

interface AdminProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: AdminUser
  onLogout: () => void
}

const AdminProfileModal = ({ isOpen, onClose, user, onLogout }: AdminProfileModalProps) => {
  if (!isOpen) return null

  const userInitials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'A'
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div 
        className="w-full max-w-[1100px] max-h-[95vh] overflow-y-auto rounded-xl bg-[#1e1e1e] shadow-2xl scrollbar-thin scrollbar-thumb-zinc-700" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 lg:p-8 text-white">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">My Profile</h2>
              <p className="mt-1 text-sm text-gray-400">View and manage your personal and vehicle information</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-[#2a2a2a] hover:text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-[#173e8e] to-[#0d536c] p-5 sm:p-6 shadow-md">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex h-14 w-14 sm:h-[72px] sm:w-[72px] shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xl sm:text-2xl font-bold tracking-wide text-white shadow-inner">
                {userInitials}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">{user.first_name} {user.last_name}</h3>
                <p className="text-xs sm:text-sm font-medium text-blue-100 capitalize">{user.role} Member</p>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-green-300">
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                  Active Account
                </div>
              </div>
            </div>
            <div className="flex w-full sm:w-auto">
              <button onClick={onLogout} className="w-full sm:w-auto rounded-lg border border-red-400/50 bg-red-500/20 px-6 py-2.5 text-sm font-bold tracking-wide text-red-100 shadow transition hover:bg-red-500/30">
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-[#333] bg-[#242424] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-6 w-6 rounded-md bg-[#2d3a56]"></div>
                  <h4 className="text-[17px] font-bold text-white">Personal Information</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[#333] bg-[#1b1b1b] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">First Name</p>
                    <p className="mt-1.5 text-[15px] font-semibold text-gray-100">{user.first_name}</p>
                  </div>
                  <div className="rounded-lg border border-[#333] bg-[#1b1b1b] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Last Name</p>
                    <p className="mt-1.5 text-[15px] font-semibold text-gray-100">{user.last_name}</p>
                  </div>
                  <div className="rounded-lg border border-[#333] bg-[#1b1b1b] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Age</p>
                    <p className="mt-1.5 text-[15px] font-bold text-gray-100">—</p>
                  </div>
                  <div className="rounded-lg border border-[#333] bg-[#1b1b1b] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Contact Number</p>
                    <p className="mt-1.5 text-[15px] font-bold text-gray-100">—</p>
                  </div>
                  <div className="col-span-1 sm:col-span-2 rounded-lg border border-[#333] bg-[#1b1b1b] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Address</p>
                    <p className="mt-1.5 text-[15px] font-bold text-gray-100">—</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#333] bg-[#242424] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-6 w-6 rounded-md bg-[#3f2a4f]"></div>
                  <h4 className="text-[17px] font-bold text-white">Vehicle Information</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-blue-900/50 bg-[#1c2230] p-4 shadow-inner">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#4d82c2]">Plate Number</p>
                    <p className="mt-1.5 text-[15px] font-bold text-gray-100">—</p>
                  </div>
                  <div className="rounded-lg border border-[#333] bg-[#1b1b1b] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Car Model</p>
                    <p className="mt-1.5 text-[15px] font-bold text-gray-100">—</p>
                  </div>
                  <div className="col-span-1 sm:col-span-2 rounded-lg border border-[#333] bg-[#1b1b1b] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Car Color</p>
                    <p className="mt-1.5 text-[15px] font-bold text-gray-100">—</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-fit rounded-xl border border-[#333] bg-[#242424] p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-6 w-6 rounded-md bg-[#243e30]"></div>
                <h4 className="text-[17px] font-bold text-white">Account Information</h4>
              </div>
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-[#333] bg-[#1b1b1b] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Email</p>
                  <p className="mt-1.5 text-[14px] font-medium text-gray-100">{user.email || 'joshsimpas6@gmail.com'}</p>
                </div>
                <div className="rounded-lg border border-[#333] bg-[#1b1b1b] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Username</p>
                  <p className="mt-1.5 text-[14px] font-medium text-gray-100">{user.username}</p>
                </div>
                <div className="rounded-lg border border-[#333] bg-[#1b1b1b] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Account ID</p>
                  <p className="mt-1.5 text-[14px] font-bold text-gray-100">#{user.user_id}</p>
                </div>
                <div className="rounded-lg border border-green-900/60 bg-[#16271e] p-5 shadow-inner">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#4ade80]">Access Status</p>
                  <div className="mt-2.5 flex items-center gap-2.5 text-[15px] font-bold text-[#4ade80]">
                    <span className="h-3 w-3 rounded-full bg-[#4ade80]"></span>
                    Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminProfileModal

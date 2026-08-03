import { useRef, useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { adminAuthApi, type AdminUser } from "../../services/adminApi"
import { useModalAnimation } from "../../hooks/useModalAnimation"
import { useAuth } from "../../hooks/useAuth"

interface AdminProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: AdminUser
  onLogout: () => void
}

const AdminProfileModal = ({ isOpen, onClose, user, onLogout }: AdminProfileModalProps) => {
  const { shouldRender, isAnimatingOut } = useModalAnimation(isOpen)
  const { updateUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploading, setUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const [editForm, setEditForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    middle_name: user.middle_name || '',
    email: user.email || '',
    username: user.username || '',
    contact_number: user.contact_number || '',
    address: user.address || '',
  })

  useEffect(() => {
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      middle_name: user.middle_name || '',
      email: user.email || '',
      username: user.username || '',
      contact_number: user.contact_number || '',
      address: user.address || '',
    })
  }, [user])

  if (!shouldRender) return null

  const userInitials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'A'

  const handleAvatarClick = () => {
    if (uploading) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', message: 'Please select a valid image file (JPG, PNG, WebP).' })
      return
    }

    try {
      setUploading(true)
      setNotification(null)

      const formData = new FormData()
      formData.append('profile_picture', file)

      const res = await adminAuthApi.updateProfile(formData)
      if (res.data?.user) {
        updateUser(res.data.user)
        setNotification({ type: 'success', message: 'Profile picture updated successfully!' })
        setTimeout(() => setNotification(null), 3500)
      }
    } catch (err: any) {
      console.error('Failed to upload profile picture:', err)
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to upload image. Please try again.' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCancelEdit = () => {
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      middle_name: user.middle_name || '',
      email: user.email || '',
      username: user.username || '',
      contact_number: user.contact_number || '',
      address: user.address || '',
    })
    setIsEditing(false)
    setNotification(null)
  }

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setNotification(null)

      const formData = new FormData()
      formData.append('first_name', editForm.first_name.trim())
      formData.append('last_name', editForm.last_name.trim())
      if (editForm.middle_name) formData.append('middle_name', editForm.middle_name.trim())
      formData.append('email', editForm.email.trim())
      formData.append('username', editForm.username.trim())
      if (editForm.contact_number) formData.append('contact_number', editForm.contact_number.trim())
      if (editForm.address) formData.append('address', editForm.address.trim())

      const res = await adminAuthApi.updateProfile(formData)
      if (res.data?.user) {
        updateUser(res.data.user)
        setNotification({ type: 'success', message: 'Profile information updated successfully!' })
        setIsEditing(false)
        setTimeout(() => setNotification(null), 3500)
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err)
      const errorMsg = err.response?.data?.message || err.response?.data?.errors 
        ? Object.values(err.response.data.errors).flat().join(', ')
        : 'Failed to save changes. Please check your inputs.'
      setNotification({ type: 'error', message: errorMsg })
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2.5 text-[14px] font-medium text-white transition focus:border-blue-400 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-blue-400"
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}`} onClick={onClose}>
      <div className={`fixed inset-0 bg-black/70 backdrop-blur-md ${isAnimatingOut ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'}`} />
      <div 
        className={`relative w-full max-w-[1100px] max-h-[95vh] overflow-y-auto rounded-xl bg-[#1e1e24]/85 backdrop-blur-xl border border-white/10 shadow-2xl scrollbar-thin scrollbar-thumb-zinc-700 ${isAnimatingOut ? 'animate-modal-panel-out' : 'animate-modal-panel-in'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 lg:p-8 text-white">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
          />

          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">My Profile</h2>
              <p className="mt-1 text-sm text-gray-400">View and manage your personal and account information</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-[#2a2a2a] hover:text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {notification && (
            <div className={`mb-4 rounded-lg border px-4 py-3 text-sm font-medium ${
              notification.type === 'error' 
                ? 'border-red-500/30 bg-red-500/10 text-red-200' 
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            }`}>
              {notification.message}
            </div>
          )}

          {/* Profile Header Banner */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-[#173e8e] to-[#0d536c] p-5 sm:p-6 shadow-md">
            <div className="flex items-center gap-4 sm:gap-5">
              <div 
                onClick={handleAvatarClick}
                className="group relative flex h-16 w-16 sm:h-[76px] sm:w-[76px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-white/10 text-xl sm:text-2xl font-bold tracking-wide text-white shadow-lg transition hover:border-white hover:scale-105"
                title="Click to upload profile picture"
              >
                {user.profile_picture && user.profile_picture.length > 0 ? (
                  <img src={user.profile_picture} alt={user.first_name} className="h-full w-full object-cover" />
                ) : (
                  userInitials
                )}
                <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white transition-opacity duration-200 ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {uploading ? (
                    <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider">Upload</span>
                    </>
                  )}
                </div>
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
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg border border-blue-200/50 bg-white/15 px-5 py-2.5 text-sm font-bold tracking-wide text-white shadow transition hover:bg-white/25"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex-1 sm:flex-none rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold tracking-wide text-white shadow transition hover:bg-white/20 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold tracking-wide text-white shadow-lg transition hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </>
              )}
              <button 
                onClick={onLogout} 
                className="flex-1 sm:flex-none rounded-lg border border-red-400/50 bg-red-500/20 px-5 py-2.5 text-sm font-bold tracking-wide text-red-100 shadow transition hover:bg-red-500/30"
              >
                Sign Out
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] items-stretch">
              {/* Left Side: Personal Information */}
              <div className="flex flex-col h-full">
                <div className="h-full rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-md bg-[#2d3a56] flex items-center justify-center">
                        <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="text-[17px] font-bold text-white">Personal Information</h4>
                    </div>
                    {isEditing && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-md border border-blue-400/30">
                        Editing Mode
                      </span>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-white/5 bg-black/25 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">First Name</p>
                        <p className="mt-1.5 text-[15px] font-semibold text-gray-100">{user.first_name}</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-black/25 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Last Name</p>
                        <p className="mt-1.5 text-[15px] font-semibold text-gray-100">{user.last_name}</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-black/25 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Age</p>
                        <p className="mt-1.5 text-[15px] font-bold text-gray-100">{user.age ?? '—'}</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-black/25 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Contact Number</p>
                        <p className="mt-1.5 text-[15px] font-bold text-gray-100">{user.contact_number || '—'}</p>
                      </div>
                      <div className="col-span-1 sm:col-span-2 rounded-lg border border-white/5 bg-black/25 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Address</p>
                        <p className="mt-1.5 text-[15px] font-bold text-gray-100">{user.address || '—'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-1.5">First Name *</label>
                        <input
                          type="text"
                          required
                          value={editForm.first_name}
                          onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-1.5">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={editForm.last_name}
                          onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-1.5">Contact Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 09123456789"
                          value={editForm.contact_number}
                          onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-1.5">Age</label>
                        <div className="w-full rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5 text-[14px] font-medium text-gray-400">
                          {user.age ?? 'Auto-calculated from birth date'}
                        </div>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-1.5">Address</label>
                        <input
                          type="text"
                          placeholder="Enter complete address"
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Account Information (Narrower Width, Perfectly Aligned Rows) */}
              <div className="flex flex-col h-full">
                <div className="h-full rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-[#243e30] flex items-center justify-center">
                      <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h4 className="text-[17px] font-bold text-white">Account Information</h4>
                  </div>

                  {!isEditing ? (
                    <div className="flex flex-col gap-4">
                      <div className="rounded-lg border border-white/5 bg-black/25 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Email</p>
                        <p className="mt-1.5 text-[15px] font-semibold text-gray-100 break-all">{user.email || '—'}</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-black/25 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Username</p>
                        <p className="mt-1.5 text-[15px] font-semibold text-gray-100">{user.username}</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-black/25 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Account ID</p>
                        <p className="mt-1.5 text-[15px] font-bold text-gray-100">#{user.user_id}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-1.5">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-1.5">Username *</label>
                        <input
                          type="text"
                          required
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-1.5">Account ID</label>
                        <div className="w-full rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5 text-[14px] font-medium text-gray-400">
                          #{user.user_id}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminProfileModal

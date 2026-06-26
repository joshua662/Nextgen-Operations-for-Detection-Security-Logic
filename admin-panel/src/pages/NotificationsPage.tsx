const NotificationsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Notifications</h1>
        <p className="mt-1 text-sm text-zinc-500">View recent system and security notifications.</p>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#18181b] p-12 text-center">
        <p className="text-sm font-medium text-zinc-500">You&apos;re all caught up. No new notifications.</p>
      </div>
    </div>
  )
}

export default NotificationsPage

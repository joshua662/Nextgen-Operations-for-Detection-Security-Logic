const NotificationsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Notifications</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">View recent system and security notifications.</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">You're all caught up. No new notifications.</p>
      </div>
    </div>
  )
}

export default NotificationsPage

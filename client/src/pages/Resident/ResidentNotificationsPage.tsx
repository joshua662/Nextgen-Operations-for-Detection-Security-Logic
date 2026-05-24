import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { NotificationItem } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";

const ResidentNotificationsPage = () => {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        GateAccessService.loadNotifications(1)
            .then((res) => setItems(res.data.notifications.data ?? []))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        GateAccessService.loadNotifications(1)
            .then((res) => setItems(res.data.notifications.data ?? []))
            .finally(() => setLoading(false));
    }, []);

    const unreadCount = items.filter((item) => !item.is_read).length;

    const markAllRead = async () => {
        await GateAccessService.markAllNotificationsRead();
        load();
    };

    const markRead = async (id: number) => {
        await GateAccessService.markNotificationRead(id);
        load();
    };

    if (loading) return <div className="flex justify-center p-12"><Spinner size="md" /></div>;

    return (
        <div className="flex h-full w-full flex-1 flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Notifications</h1>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">Stay updated on gate access alerts and system messages</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    {unreadCount > 0 && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {unreadCount} Unread
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button type="button" onClick={markAllRead} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {items.length > 0 ? items.map((notification) => {
                    const meta = notificationMeta(notification.type);

                    return (
                        <div
                            key={notification.notification_id}
                            className={`rounded-r-lg border-l-4 p-4 ${notification.is_read ? "border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900" : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{notification.title || "System Notification"}</h3>
                                        {!notification.is_read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                                    </div>
                                    <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">{notification.message}</p>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className={`rounded px-2 py-1 text-xs font-medium ${meta.className}`}>{meta.label}</span>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(notification.created_at).toLocaleString()}</p>
                                    </div>
                                </div>

                                {!notification.is_read && (
                                    <button
                                        type="button"
                                        title="Mark as read"
                                        onClick={() => markRead(notification.notification_id)}
                                        className="text-sm font-medium text-zinc-400 transition hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                                    >
                                        Read
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="rounded-xl border border-zinc-200 py-12 text-center dark:border-zinc-700">
                        <p className="text-lg text-zinc-500 dark:text-zinc-400">No notifications</p>
                        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">You're all caught up.</p>
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-200">Notification Types</h3>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                    <li><strong>Gate Access:</strong> When you successfully enter or exit the subdivision</li>
                    <li><strong>Unauthorized:</strong> When there is an unauthorized access attempt with your plate</li>
                    <li><strong>Update Request:</strong> When your profile or guest access request is reviewed</li>
                    <li><strong>System:</strong> Important system announcements and maintenance notices</li>
                </ul>
            </div>
        </div>
    );
};

const notificationMeta = (type: string) => {
    const map: Record<string, { label: string; className: string }> = {
        gate_open: { label: "Gate Access", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
        unauthorized: { label: "Unauthorized", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
        update_request: { label: "Update Request", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
        system: { label: "System", className: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400" },
    };

    return map[type] ?? { label: "General", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
};

export default ResidentNotificationsPage;

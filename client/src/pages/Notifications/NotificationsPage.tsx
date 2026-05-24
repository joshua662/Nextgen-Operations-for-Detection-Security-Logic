import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { NotificationItem } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";

const NotificationsPage = () => {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        GateAccessService.loadNotifications(1)
            .then((res) => setItems(res.data.notifications.data ?? []))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const markAll = async () => {
        setLoading(true);
        await GateAccessService.markAllNotificationsRead();
        load();
    };

    const markRead = async (id: number) => {
        setLoading(true);
        await GateAccessService.markNotificationRead(id);
        load();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Notifications</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">View system alerts and important notifications</p>
                </div>
                {items.some((item) => !item.is_read) && (
                    <button type="button" onClick={markAll} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">Mark all as read</button>
                )}
            </div>

            {loading ? <div className="flex justify-center p-8"><Spinner size="md" /></div> : (
                <div className="space-y-4">
                    {items.length > 0 ? items.map((notification) => (
                        <div key={notification.notification_id} className={`rounded-lg border border-zinc-200 p-4 dark:border-zinc-700 ${notification.is_read ? "bg-white dark:bg-zinc-800" : "bg-blue-50 dark:bg-blue-900/20"}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{notification.title}</h3>
                                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{notification.message}</p>
                                    <p className="mt-2 text-xs text-zinc-500">{new Date(notification.created_at).toLocaleString()}</p>
                                </div>
                                {!notification.is_read && (
                                    <button type="button" onClick={() => markRead(notification.notification_id)} className="shrink-0 rounded px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30">
                                        Mark as Read
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="rounded-xl border border-zinc-200 py-8 text-center text-zinc-500 dark:border-zinc-700">No notifications</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;

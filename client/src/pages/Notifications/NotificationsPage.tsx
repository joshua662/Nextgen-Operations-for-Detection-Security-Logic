import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { NotificationItem } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";

const NotificationsPage = () => {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        GateAccessService.loadNotifications(1)
            .then((res) => setItems(res.data.notifications.data ?? []))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const markAll = async () => {
        await GateAccessService.markAllNotificationsRead();
        load();
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                <button type="button" onClick={markAll} className="text-sm text-blue-600">Mark all read</button>
            </div>
            {loading ? <Spinner size="md" /> : (
                <ul className="space-y-3">
                    {items.map((n) => (
                        <li key={n.notification_id} className={`p-4 rounded-xl border ${n.is_read ? "bg-gray-50 dark:bg-gray-800" : "bg-blue-50 dark:bg-blue-900/20 border-blue-200"}`}>
                            <p className="font-semibold text-gray-900 dark:text-white">{n.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                        </li>
                    ))}
                    {items.length === 0 && <p className="text-gray-500">No notifications.</p>}
                </ul>
            )}
        </div>
    );
};

export default NotificationsPage;

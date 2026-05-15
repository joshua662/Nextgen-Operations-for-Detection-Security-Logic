import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { NotificationItem } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";

const ResidentNotificationsPage = () => {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        GateAccessService.loadNotifications(1)
            .then((res) => setItems(res.data.notifications.data ?? []))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner size="md" />;

    return (
        <div className="space-y-3">
            <h2 className="font-semibold">Notifications</h2>
            {items.map((n) => (
                <div key={n.notification_id} className={`p-4 rounded-xl border ${!n.is_read ? "bg-blue-50 border-blue-200" : "bg-white"}`}>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                </div>
            ))}
            {items.length === 0 && <p className="text-gray-500 text-sm">No notifications.</p>}
        </div>
    );
};

export default ResidentNotificationsPage;

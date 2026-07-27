import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { NotificationItem } from "../../interfaces/GateInterface";

const ClientNotificationsSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700 bg-white dark:bg-zinc-800 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-72 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3.5 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="h-8 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    ))}
  </div>
);

interface RequestItem {
    update_request_id: number;
    user_id: number;
    status: string;
    requested_changes?: {
        request_type?: string;
        guest_name?: string;
    };
}

const NotificationsPage = () => {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [allRequests, setAllRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<"approved" | "rejected" | null>(null);

    const load = () => {
        setLoading(true);
        Promise.all([
            GateAccessService.loadNotifications(1),
            GateAccessService.loadUpdateRequests(1)
        ])
            .then(([notifRes, reqRes]) => {
                setItems(notifRes.data.notifications.data ?? []);
                setAllRequests(reqRes.data.requests.data ?? []);
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const handleMarkAllRead = async () => {
        setLoading(true);
        await GateAccessService.markAllNotificationsRead();
        load();
        window.dispatchEvent(new Event('notifications_updated'));
        setLoading(false);
    };

    const markRead = async (id: number) => {
        setLoading(true);
        await GateAccessService.markNotificationRead(id);
        load();
        window.dispatchEvent(new Event('notifications_updated'));
    };

    const deleteNotification = async (id: number) => {
        setLoading(true);
        try {
            await GateAccessService.deleteNotification(id);
            window.dispatchEvent(new Event('notifications_updated'));
        } catch (e) {
            console.error(e);
        } finally {
            load();
        }
    };

    const deleteProcessedHistory = async () => {
        if (!confirm("Are you sure you want to delete all processed history notifications?")) return;
        setLoading(true);
        try {
            const readItems = items.filter((item) => item.is_read);
            await Promise.all(readItems.map((item) => GateAccessService.deleteNotification(item.notification_id)));
            window.dispatchEvent(new Event('notifications_updated'));
        } catch (e) {
            console.error(e);
        } finally {
            load();
        }
    };

    const reviewRequest = async (requestId: number, status: "approved" | "rejected", notificationId: number) => {
        setLoading(true);
        try {
            await GateAccessService.reviewUpdateRequest(requestId, { status });
            await GateAccessService.markNotificationRead(notificationId);
            window.dispatchEvent(new Event('notifications_updated'));
        } catch (e) {
            console.error(e);
        } finally {
            load();
        }
    };

    const displayedItems = items.filter((item) => {
        if (!statusFilter) return true;

        const requestIdMatch = item.message.match(/\[REQUEST_ID:(\d+)\]/);
        let requestId = requestIdMatch ? parseInt(requestIdMatch[1], 10) : null;
        if (!requestId) {
            const matchedReq = allRequests.find((r) =>
                (item.message.toLowerCase().includes(r.requested_changes?.guest_name?.toLowerCase() ?? "___xyz___")) ||
                (item.user_id && r.user_id === item.user_id)
            );
            if (matchedReq) requestId = matchedReq.update_request_id;
        }

        const matchedReq = requestId ? allRequests.find((r) => r.update_request_id === requestId) : null;
        const status = (matchedReq?.status || (item.message.toLowerCase().includes("approved") ? "approved" : (item.message.toLowerCase().includes("rejected") ? "rejected" : "pending"))).toLowerCase();

        return status === statusFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Notifications
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        View gate security alerts and guest pass requests
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === "approved" ? null : "approved")}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95 ${
                            statusFilter === "approved"
                                ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                                : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                        }`}
                    >
                        ✓ Approved Pass
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === "rejected" ? null : "rejected")}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95 ${
                            statusFilter === "rejected"
                                ? "bg-rose-600 text-white ring-2 ring-rose-400"
                                : "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500"
                        }`}
                    >
                        ✕ Disapproved
                    </button>

                    <button
                        type="button"
                        onClick={deleteProcessedHistory}
                        title="Clear History Log"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-95 dark:bg-amber-600 dark:hover:bg-amber-500"
                    >
                        🗑️ Trash History
                    </button>

                    {statusFilter && (
                        <button
                            type="button"
                            onClick={() => setStatusFilter(null)}
                            className="ml-1 text-xs text-zinc-400 hover:underline"
                        >
                            Clear Filter
                        </button>
                    )}

                    {items.some((item) => !item.is_read) && (
                        <button type="button" onClick={handleMarkAllRead} className="ml-2 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">Mark all as read</button>
                    )}
                </div>
            </div>

            {loading ? <ClientNotificationsSkeleton /> : (
                <div className="space-y-4">
                    {displayedItems.length > 0 ? displayedItems.map((notification) => {
                        const requestIdMatch = notification.message.match(/\[REQUEST_ID:(\d+)\]/);
                        let requestId = requestIdMatch ? parseInt(requestIdMatch[1], 10) : null;

                        if (!requestId && (notification.title.includes("Guest Access") || notification.title.includes("Request"))) {
                            const matchedReq = allRequests.find((r) =>
                                (notification.message.toLowerCase().includes(r.requested_changes?.guest_name?.toLowerCase() ?? "___xyz___")) ||
                                (notification.user_id && r.user_id === notification.user_id)
                            );
                            if (matchedReq) {
                                requestId = matchedReq.update_request_id;
                            }
                        }

                        const matchedReq = requestId ? allRequests.find((r) => r.update_request_id === requestId) : null;
                        const reqStatus = matchedReq ? matchedReq.status.toLowerCase() : (notification.message.toLowerCase().includes("approved") ? "approved" : (notification.message.toLowerCase().includes("rejected") ? "rejected" : "pending"));
                        const isPending = reqStatus === "pending";

                        const cleanMessage = notification.message.replace(/\s*\[REQUEST_ID:\d+\]/, '');

                        return (
                            <div key={notification.notification_id} className={`rounded-xl border border-zinc-200 p-4 transition dark:border-zinc-700 ${notification.is_read ? "bg-white dark:bg-zinc-800" : "bg-blue-50/70 dark:bg-blue-900/20"}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{notification.title}</h3>
                                                {!notification.is_read ? (
                                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                                ) : (
                                                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">HISTORY LOG</span>
                                                )}
                                            </div>

                                            {/* Action Buttons OR Status Badge + Trash Icon */}
                                            <div className="flex items-center gap-2">
                                                {requestId && isPending ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => reviewRequest(requestId!, "approved", notification.notification_id)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                                                        >
                                                            ✓ Approve Pass
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => reviewRequest(requestId!, "rejected", notification.notification_id)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
                                                        >
                                                            ✕ Disapprove
                                                        </button>
                                                    </>
                                                ) : reqStatus === "approved" ? (
                                                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        ✓ APPROVED
                                                    </span>
                                                ) : reqStatus === "rejected" ? (
                                                    <span className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                                                        ✕ DISAPPROVED
                                                    </span>
                                                ) : null}

                                                {/* Trash / Delete button for Notification item */}
                                                <button
                                                    type="button"
                                                    onClick={() => deleteNotification(notification.notification_id)}
                                                    title="Delete notification"
                                                    className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 text-zinc-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-rose-900/50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{cleanMessage}</p>
                                        <p className="mt-2 text-xs text-zinc-400">{new Date(notification.created_at).toLocaleString()}</p>
                                    </div>

                                    {!notification.is_read && (
                                        <button type="button" onClick={() => markRead(notification.notification_id)} className="shrink-0 rounded-lg px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30">
                                            Mark Read
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="rounded-xl border border-zinc-200 py-8 text-center text-zinc-500 dark:border-zinc-700">
                            No notifications found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;

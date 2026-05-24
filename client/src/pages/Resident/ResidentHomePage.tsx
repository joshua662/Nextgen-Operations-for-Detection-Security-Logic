import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import GateAccessService from "../../services/GateAccessService";
import type { GateLog, NotificationItem } from "../../interfaces/GateInterface";
import { useAuth } from "../../contexts/AuthContext";
import Spinner from "../../components/Spinner/Spinner";

const ResidentHomePage = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<GateLog[]>([]);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            GateAccessService.myGateLogs(1),
            GateAccessService.loadNotifications(1),
        ])
            .then(([logsRes, notifRes]) => {
                setLogs(logsRes.data.logs.data ?? []);
                setNotifications((notifRes.data.notifications.data ?? []).slice(0, 5));
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

    const displayName = [user?.user?.first_name, user?.user?.last_name].filter(Boolean).join(" ") || "Resident";
    const lastEntry = logs.find((log) => log.direction === "IN");
    const lastExit = logs.find((log) => log.direction === "OUT");
    const unauthorizedCount = logs.filter((log) => log.status === "unauthorized").length;

    return (
        <div className="flex h-full w-full flex-1 flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Welcome, {displayName}!</h1>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">Gate Security System - Resident Portal</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard
                    title="Last Entry"
                    icon={<BarIcon className="text-green-600 dark:text-green-400" />}
                    value={lastEntry ? formatTime(lastEntry.logged_at) : "No entries yet"}
                    sub={lastEntry ? formatDate(lastEntry.logged_at) : undefined}
                    badge={lastEntry ? "AUTHORIZED" : undefined}
                    badgeClass="text-green-600 dark:text-green-400"
                />
                <SummaryCard
                    title="Last Exit"
                    icon={<ExitIcon className="text-blue-600 dark:text-blue-400" />}
                    value={lastExit ? formatTime(lastExit.logged_at) : "No exits yet"}
                    sub={lastExit ? formatDate(lastExit.logged_at) : undefined}
                    badge={lastExit ? "AUTHORIZED" : undefined}
                    badgeClass="text-blue-600 dark:text-blue-400"
                />
                <SummaryCard
                    title="Access Status"
                    icon={<LockIcon className="text-zinc-600 dark:text-zinc-400" />}
                    value="Authorized"
                    sub={`${logs.length} total accesses`}
                    badge={unauthorizedCount > 0 ? `${unauthorizedCount} unauthorized attempts` : undefined}
                    badgeClass="text-red-600 dark:text-red-400"
                    valueClass="text-green-600 dark:text-green-400"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800 lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recent Notifications</h2>
                        <Link to="/resident/notifications" className="text-sm text-blue-600 hover:underline dark:text-blue-400">View All</Link>
                    </div>
                    {notifications.length > 0 ? (
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <div key={notification.notification_id} className="rounded border-l-4 border-blue-500 bg-blue-50 p-3 dark:bg-blue-900/20">
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{notification.title || "System Alert"}</p>
                                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{limitText(notification.message, 100)}</p>
                                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{formatRelative(notification.created_at)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="py-6 text-center text-zinc-500 dark:text-zinc-400">No notifications yet</p>
                    )}
                </section>

                <aside className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
                    <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Quick Links</h2>
                    <div className="space-y-3">
                        <QuickLink to="/resident/profile" icon={<UserIcon />} title="My Profile" sub="View details" />
                        <QuickLink to="/resident/logs" icon={<ClipboardIcon />} title="Gate Logs" sub="IN/OUT history" />
                        <QuickLink to="/resident/updates" icon={<CarIcon />} title="Guest Access" sub="Request visitor access" />
                    </div>
                </aside>
            </div>
        </div>
    );
};

const SummaryCard = ({
    title,
    icon,
    value,
    sub,
    badge,
    badgeClass,
    valueClass,
}: {
    title: string;
    icon: ReactNode;
    value: string;
    sub?: string;
    badge?: string;
    badgeClass: string;
    valueClass?: string;
}) => (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</h3>
            {icon}
        </div>
        <p className={`text-2xl font-bold ${valueClass ?? "text-zinc-900 dark:text-zinc-100"}`}>{value}</p>
        {sub && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
        {badge && <p className={`mt-1 text-xs font-medium ${badgeClass}`}>{badge}</p>}
    </div>
);

const QuickLink = ({ to, icon, title, sub }: { to: string; icon: ReactNode; title: string; sub: string }) => (
    <Link to={to} className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-zinc-100 dark:hover:bg-zinc-700">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-blue-600 dark:bg-zinc-700 dark:text-blue-400">{icon}</span>
        <span>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
        </span>
    </Link>
);

const formatDate = (value: string) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const formatRelative = (value: string) => new Date(value).toLocaleString();
const limitText = (value: string, limit: number) => value.length > limit ? `${value.slice(0, limit)}...` : value;

const Svg = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
    <svg className={`h-5 w-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{children}</svg>
);
const BarIcon = ({ className }: { className?: string }) => <Svg className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 19V9m8 10V5m8 14v-7" /></Svg>;
const ExitIcon = ({ className }: { className?: string }) => <Svg className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H3m0 0 4-4m-4 4 4 4m5-9V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2" /></Svg>;
const LockIcon = ({ className }: { className?: string }) => <Svg className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11V8a5 5 0 0 1 10 0v3m-9 0h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" /></Svg>;
const UserIcon = () => <Svg><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" /></Svg>;
const ClipboardIcon = () => <Svg><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5h6m-8 4h10M7 13h10M7 17h6M9 3h6a2 2 0 0 1 2 2h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1a2 2 0 0 1 2-2Z" /></Svg>;
const CarIcon = () => <Svg><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 17h14M7 17a2 2 0 1 1-4 0m18 0a2 2 0 1 1-4 0M5 17V9l2-4h10l2 4v8M7 9h10" /></Svg>;

export default ResidentHomePage;

import { useEffect, useState, type ReactNode } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { DashboardOverview, GateLog } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";
import { useAuth } from "../../contexts/AuthContext";
import ResidentsPage from "../Residents/ResidentsPage";
import GateLogsPage from "../GateLogs/GateLogsPage";
import UpdateRequestsPage from "../UpdateRequests/UpdateRequestsPage";
import ReportsPage from "../Reports/ReportsPage";

type QuickActionKey = "residents" | "gate-logs" | "update-requests" | "reports";

const QUICK_ACTIONS: {
    key: QuickActionKey;
    label: string;
    primary?: boolean;
}[] = [
        {
            key: "residents",
            label: "Manage Residents",
            primary: true,
        },
        {
            key: "gate-logs",
            label: "View Gate Logs",
        },
        {
            key: "update-requests",
            label: "Review Requests",
        },
        {
            key: "reports",
            label: "View Reports",
        },
    ];

const DashboardPage = () => {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeQuickAction, setActiveQuickAction] = useState<QuickActionKey | null>(null);

    useEffect(() => {
        GateAccessService.dashboardOverview()
            .then((res) => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!activeQuickAction) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setActiveQuickAction(null);
        };

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [activeQuickAction]);

    if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
    if (!data) return <p className="text-zinc-500">Unable to load dashboard.</p>;

    const displayName = [user?.user?.first_name, user?.user?.last_name].filter(Boolean).join(" ") || "Admin";

    return (
        <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-xl">
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Welcome, {displayName}!</h1>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">Gate Security System - Security Guard Dashboard</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Residents" value={data.stats.total_residents} />
                <StatCard label="Today's Entries" value={data.stats.authorized_entries} />
                <StatCard label="Pending Requests" value={data.stats.pending_update_requests} />
                <StatCard label="Unauthorized Today" value={data.stats.unauthorized_attempts} danger />
            </div>

            <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
                <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {QUICK_ACTIONS.map((action) => (
                        <QuickActionButton
                            key={action.key}
                            primary={action.primary}
                            onClick={() => setActiveQuickAction(action.key)}
                        >
                            {action.label}
                        </QuickActionButton>
                    ))}
                </div>
            </section>

            {activeQuickAction && (
                <QuickActionModal
                    action={QUICK_ACTIONS.find((action) => action.key === activeQuickAction) ?? QUICK_ACTIONS[0]}
                    onClose={() => setActiveQuickAction(null)}
                />
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800 lg:col-span-2">
                    <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Live Camera Feed</h2>
                    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-zinc-900">
                        {data.camera_stream_url && (
                            <img
                                src={data.camera_stream_url}
                                alt="Gate camera"
                                className="h-full w-full object-cover"
                                onError={(event) => { event.currentTarget.style.display = "none"; }}
                            />
                        )}
                        <p className="absolute rounded bg-black/50 px-3 py-1 text-sm text-zinc-200">
                            Stream: {data.camera_status} | Sensor: {data.sensor_status} | Gate: {data.gate_status}
                        </p>
                    </div>
                </section>

                <section className="h-fit rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800">
                    <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">System Health</h2>
                    <div className="space-y-3">
                        <HealthRow label="Camera" status={data.camera_status} />
                        <HealthRow label="Sensors" status={data.sensor_status} />
                        <HealthRow label="Gate" status={data.gate_status} />
                        <HealthRow label="Pending Updates" status={String(data.stats.pending_update_requests)} />
                        <HealthRow label="Unread Alerts" status={String(data.stats.unread_notifications)} />
                    </div>
                </section>
            </div>

            <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Recent Gate Activity</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
                        <thead className="bg-zinc-50 dark:bg-zinc-900">
                            <tr>
                                <Head>Plate Number</Head>
                                <Head>Owner Name</Head>
                                <Head>Direction</Head>
                                <Head>Status</Head>
                                <Head>Timestamp</Head>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
                            {data.recent_logs.length > 0 ? data.recent_logs.map((log: GateLog) => (
                                <tr key={log.gate_log_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                                    <td className="px-6 py-4 font-mono text-zinc-900 dark:text-zinc-100">{log.plate_number}</td>
                                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">{log.owner_name ?? "N/A"}</td>
                                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">{log.direction}</td>
                                    <td className="px-6 py-4"><StatusBadge status={log.status} /></td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{new Date(log.logged_at).toLocaleString()}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No recent gate activity</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

const StatCard = ({ label, value, danger }: { label: string; value: number; danger?: boolean }) => (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</h3>
        <p className={`mt-2 text-3xl font-bold ${danger ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`}>{value}</p>
    </div>
);

const QuickActionModal = ({ action, onClose }: { action: (typeof QUICK_ACTIONS)[number]; onClose: () => void }) => (
    <div
        className="fixed inset-0 z-50 bg-black/60 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-action-title"
        onClick={onClose}
    >
        <div
            className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-800"
            onClick={(event) => event.stopPropagation()}
        >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
                <div>
                    <h2 id="quick-action-title" className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{action.label}</h2>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
                    aria-label="Close popup"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white p-5 dark:bg-zinc-800">
                <QuickActionContent actionKey={action.key} />
            </div>
        </div>
    </div>
);

const QuickActionContent = ({ actionKey }: { actionKey: QuickActionKey }) => {
    if (actionKey === "residents") return <ResidentsPage />;
    if (actionKey === "gate-logs") return <GateLogsPage />;
    if (actionKey === "update-requests") return <UpdateRequestsPage />;
    return <ReportsPage />;
};

const QuickActionButton = ({ children, onClick, primary }: { children: ReactNode; onClick: () => void; primary?: boolean }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition ${primary
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                : "border border-zinc-300 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-700"
            }`}
    >
        {children}
    </button>
);

const HealthRow = ({ label, status }: { label: string; status: string }) => (
    <div className="flex justify-between gap-4 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-medium capitalize text-zinc-900 dark:text-zinc-100">{status}</span>
    </div>
);

const Head = ({ children }: { children: string }) => (
    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{children}</th>
);

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${status === "authorized"
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
        }`}>
        {status}
    </span>
);

export default DashboardPage;

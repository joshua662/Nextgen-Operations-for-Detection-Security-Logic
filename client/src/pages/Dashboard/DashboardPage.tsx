import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { DashboardOverview, GateLog } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";

const DashboardPage = () => {
    const [data, setData] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        GateAccessService.dashboardOverview()
            .then((res) => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
    if (!data) return <p className="p-6 text-gray-500">Unable to load dashboard.</p>;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gate Security Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Gate Status" value={data.gate_status.toUpperCase()} accent={data.gate_status === "open" ? "green" : "red"} />
                <StatCard label="Authorized Today" value={String(data.stats.authorized_entries)} accent="blue" />
                <StatCard label="Unauthorized Today" value={String(data.stats.unauthorized_attempts)} accent="amber" />
                <StatCard label="Total Residents" value={String(data.stats.total_residents)} accent="slate" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <h2 className="font-semibold mb-3 text-gray-900 dark:text-white">Live Camera Feed (ESP32-CAM)</h2>
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
                        {data.camera_stream_url ? (
                            <img src={data.camera_stream_url} alt="Gate camera" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : null}
                        <p className="text-gray-400 text-sm absolute">Stream: {data.camera_status} | Sensor: {data.sensor_status}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    <h2 className="font-semibold text-gray-900 dark:text-white">System Health</h2>
                    <HealthRow label="Camera" status={data.camera_status} />
                    <HealthRow label="Sensors" status={data.sensor_status} />
                    <HealthRow label="Pending Updates" status={String(data.stats.pending_update_requests)} />
                    <HealthRow label="Unread Alerts" status={String(data.stats.unread_notifications)} />
                </div>
            </div>

            <div className="bg-white white:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Recent Gate Activity</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Plate</th><th>Owner</th><th>Dir</th><th>Status</th><th>Time</th></tr></thead>
                        <tbody>
                            {data.recent_logs.map((log: GateLog) => (
                                <tr key={log.gate_log_id} className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="py-2 font-mono">{log.plate_number}</td>
                                    <td>{log.owner_name ?? "—"}</td>
                                    <td>{log.direction}</td>
                                    <td><StatusBadge status={log.status} /></td>
                                    <td>{new Date(log.logged_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, accent }: { label: string; value: string; accent: string }) => {
    const colors: Record<string, string> = {
        green: "border-green-500 bg-green-50 dark:bg-green-900/20",
        red: "border-red-500 bg-red-50 dark:bg-red-900/20",
        blue: "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
        amber: "border-amber-500 bg-amber-50 dark:bg-amber-900/20",
        slate: "border-gray-400 bg-gray-50 dark:bg-gray-900/20",
    };
    return (
        <div className={`rounded-xl border-l-4 p-4 ${colors[accent] ?? colors.slate}`}>
            <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    );
};

const HealthRow = ({ label, status }: { label: string; status: string }) => (
    <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white capitalize">{status}</span>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${status === "authorized" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        {status}
    </span>
);

export default DashboardPage;

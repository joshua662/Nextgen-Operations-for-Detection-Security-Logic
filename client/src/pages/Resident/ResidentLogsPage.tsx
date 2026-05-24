import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { GateLog } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";

const ResidentLogsPage = () => {
    const [logs, setLogs] = useState<GateLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        GateAccessService.myGateLogs(1)
            .then((res) => setLogs(res.data.logs.data ?? []))
            .finally(() => setLoading(false));
    }, []);

    const today = new Date().toDateString();
    const entriesToday = logs.filter((log) => log.direction === "IN" && new Date(log.logged_at).toDateString() === today).length;
    const exitsToday = logs.filter((log) => log.direction === "OUT" && new Date(log.logged_at).toDateString() === today).length;
    const unauthorized = logs.filter((log) => log.status === "unauthorized").length;

    if (loading) return <div className="flex justify-center p-12"><Spinner size="md" /></div>;

    return (
        <div className="flex h-full w-full flex-1 flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Gate Access Logs</h1>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">Your personal IN/OUT history and access records</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatMini label="Total Entries Today" value={String(entriesToday)} />
                <StatMini label="Total Exits Today" value={String(exitsToday)} />
                <StatMini label="Unauthorized Attempts" value={String(unauthorized)} danger />
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                {logs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
                                <tr>
                                    <Head>Date & Time</Head>
                                    <Head>Status</Head>
                                    <Head>Access Type</Head>
                                    <Head>Plate Number</Head>
                                    <Head center>Image</Head>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                                {logs.map((log) => (
                                    <tr key={log.gate_log_id} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                                        <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                                            <p className="font-medium">{new Date(log.logged_at).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(log.logged_at).toLocaleTimeString()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex items-center gap-2 font-medium ${log.status === "authorized" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                                                <span className={`h-2 w-2 rounded-full ${log.status === "authorized" ? "bg-green-500" : "bg-red-500"}`} />
                                                {log.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${log.direction === "IN" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                                                {log.direction === "IN" ? "Entry" : "Exit"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-zinc-900 dark:text-zinc-100">{log.plate_number || "-"}</td>
                                        <td className="px-6 py-4 text-center">
                                            {log.capture_image ? (
                                                <button type="button" onClick={() => setImagePreview(log.capture_image ?? null)} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                                                    View
                                                </button>
                                            ) : (
                                                <span className="text-sm text-zinc-500 dark:text-zinc-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-lg text-zinc-500 dark:text-zinc-400">No gate logs found</p>
                        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Your gate access history will appear here</p>
                    </div>
                )}
            </div>

            {imagePreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-2xl rounded-xl bg-white p-4 dark:bg-zinc-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Captured Plate Image</h3>
                            <button type="button" onClick={() => setImagePreview(null)} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">x</button>
                        </div>
                        <img src={imagePreview} alt="Captured plate" className="w-full rounded-lg" />
                    </div>
                </div>
            )}
        </div>
    );
};

const Head = ({ children, center }: { children: string; center?: boolean }) => (
    <th className={`px-6 py-3 text-xs font-semibold uppercase text-zinc-700 dark:text-zinc-300 ${center ? "text-center" : "text-left"}`}>{children}</th>
);

const StatMini = ({ label, value, danger }: { label: string; value: string; danger?: boolean }) => (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="mb-1 text-xs font-semibold uppercase text-zinc-600 dark:text-zinc-400">{label}</p>
        <p className={`text-2xl font-bold ${danger ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`}>{value}</p>
    </div>
);

export default ResidentLogsPage;

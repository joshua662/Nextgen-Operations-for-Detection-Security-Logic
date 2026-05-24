import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { GateLog } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";

const GateLogsPage = () => {
    const [logs, setLogs] = useState<GateLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [direction, setDirection] = useState("");
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const handle = window.setTimeout(() => {
            GateAccessService.loadGateLogs(1, { direction, status, search })
                .then((res) => setLogs(res.data.logs.data ?? []))
                .finally(() => setLoading(false));
        }, 200);

        return () => window.clearTimeout(handle);
    }, [direction, status, search]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Gate Logs</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">View all gate entry and exit events</p>
            </div>

            <div className="flex flex-wrap gap-4">
                <input
                    value={search}
                    onChange={(event) => { setLoading(true); setSearch(event.target.value); }}
                    placeholder="Search by plate number or owner name..."
                    className="min-w-[220px] flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <select value={direction} onChange={(event) => { setLoading(true); setDirection(event.target.value); }} className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                    <option value="">All Directions</option>
                    <option value="IN">Entry</option>
                    <option value="OUT">Exit</option>
                </select>
                <select value={status} onChange={(event) => { setLoading(true); setStatus(event.target.value); }} className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                    <option value="">All Status</option>
                    <option value="authorized">Authorized</option>
                    <option value="unauthorized">Unauthorized</option>
                </select>
            </div>

            {loading ? <div className="flex justify-center p-8"><Spinner size="md" /></div> : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <table className="w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
                        <thead className="bg-zinc-50 dark:bg-zinc-900">
                            <tr>
                                <Head>Timestamp</Head>
                                <Head>Plate Number</Head>
                                <Head>Owner Name</Head>
                                <Head>Car Info</Head>
                                <Head>Direction</Head>
                                <Head>Status</Head>
                                <Head>Image</Head>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
                            {logs.length > 0 ? logs.map((log) => (
                                <tr key={log.gate_log_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                                    <td className="whitespace-nowrap px-6 py-4 text-zinc-900 dark:text-zinc-100">{new Date(log.logged_at).toLocaleString()}</td>
                                    <td className="whitespace-nowrap px-6 py-4 font-mono text-zinc-900 dark:text-zinc-100">{log.plate_number}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-zinc-900 dark:text-zinc-100">{log.owner_name ?? "N/A"}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-zinc-900 dark:text-zinc-100">{log.car_model || log.car_color ? `${log.car_model ?? "N/A"} - ${log.car_color ?? "N/A"}` : "N/A"}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-zinc-900 dark:text-zinc-100">{log.direction === "IN" ? "Entry" : "Exit"}</td>
                                    <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={log.status} /></td>
                                    <td className="px-6 py-4">
                                        {log.capture_image ? <img src={log.capture_image} alt="Gate capture" className="h-10 w-16 rounded object-cover" /> : <span className="text-zinc-500">-</span>}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">No logs found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const Head = ({ children }: { children: string }) => (
    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{children}</th>
);

const StatusBadge = ({ status }: { status: GateLog["status"] }) => (
    <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${status === "authorized" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"}`}>
        {status}
    </span>
);

export default GateLogsPage;

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
        setLoading(true);
        GateAccessService.loadGateLogs(1, { direction, status, search })
            .then((res) => setLogs(res.data.logs.data ?? []))
            .finally(() => setLoading(false));
    }, [direction, status, search]);

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Gate Logs</h1>
            <div className="flex flex-wrap gap-3 mb-4">
                <select className="border rounded-lg px-3 py-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value)}>
                    <option value="">All Directions</option>
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                </select>
                <select className="border rounded-lg px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="authorized">Authorized</option>
                    <option value="unauthorized">Unauthorized</option>
                </select>
                <input className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]" placeholder="Search plate or owner" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {loading ? <Spinner size="md" /> : (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="p-3 text-left">Plate</th>
                                <th>Owner</th>
                                <th>Car</th>
                                <th>Color</th>
                                <th>Dir</th>
                                <th>Status</th>
                                <th>Time</th>
                                <th>Image</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.gate_log_id} className="border-t">
                                    <td className="p-3 font-mono">{log.plate_number}</td>
                                    <td className="p-3">{log.owner_name ?? "—"}</td>
                                    <td className="p-3">{log.car_model ?? "—"}</td>
                                    <td className="p-3">{log.car_color ?? "—"}</td>
                                    <td className="p-3">{log.direction}</td>
                                    <td className="p-3">
                                        <span className={log.status === "authorized" ? "text-green-600" : "text-red-600"}>{log.status}</span>
                                    </td>
                                    <td className="p-3">{new Date(log.logged_at).toLocaleString()}</td>
                                    <td className="p-3">
                                        {log.capture_image ? (
                                            <img src={log.capture_image} alt="capture" className="h-10 w-16 object-cover rounded" />
                                        ) : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default GateLogsPage;

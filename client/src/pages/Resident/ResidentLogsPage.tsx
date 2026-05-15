import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { GateLog } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";

const ResidentLogsPage = () => {
    const [logs, setLogs] = useState<GateLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        GateAccessService.myGateLogs(1)
            .then((res) => setLogs(res.data.logs.data ?? []))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner size="md" />;

    return (
        <div className="space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">My Gate Access Logs</h2>
            {logs.map((log) => (
                <div key={log.gate_log_id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border flex gap-3">
                    {log.capture_image && <img src={log.capture_image} alt="" className="w-16 h-12 object-cover rounded" />}
                    <div>
                        <p className="font-mono font-medium">{log.plate_number}</p>
                        <p className="text-sm">{log.direction} — <span className={log.status === "authorized" ? "text-green-600" : "text-red-600"}>{log.status}</span></p>
                        <p className="text-xs text-gray-400">{new Date(log.logged_at).toLocaleString()}</p>
                    </div>
                </div>
            ))}
            {logs.length === 0 && <p className="text-gray-500 text-sm">No gate activity yet.</p>}
        </div>
    );
};

export default ResidentLogsPage;

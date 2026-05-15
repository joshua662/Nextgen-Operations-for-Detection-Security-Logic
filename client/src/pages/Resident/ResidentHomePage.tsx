import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { GateLog } from "../../interfaces/GateInterface";
import { useAuth } from "../../contexts/AuthContext";

const ResidentHomePage = () => {
    const { user } = useAuth();
    const [gateStatus, setGateStatus] = useState("closed");
    const [recentLog, setRecentLog] = useState<GateLog | null>(null);

    useEffect(() => {
        GateAccessService.gateStatus().then((r) => setGateStatus(r.data.gate_status));
        GateAccessService.myGateLogs(1).then((r) => {
            const logs = r.data.logs.data ?? [];
            if (logs[0]) setRecentLog(logs[0]);
        });
    }, []);

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
                <p className="text-sm text-gray-500">Welcome back</p>
                <p className="text-lg font-bold">{user?.user?.first_name} {user?.user?.last_name}</p>
                <p className="font-mono text-blue-600 mt-1">{user?.user?.plate_number}</p>
            </div>
            <div className={`rounded-xl p-4 text-white ${gateStatus === "open" ? "bg-green-600" : "bg-gray-700"}`}>
                <p className="text-sm opacity-80">Gate Status</p>
                <p className="text-2xl font-bold uppercase">{gateStatus}</p>
            </div>
            {recentLog && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
                    <p className="text-sm font-medium text-gray-500">Last Activity</p>
                    <p className="mt-1">{recentLog.direction} — <span className={recentLog.status === "authorized" ? "text-green-600" : "text-red-600"}>{recentLog.status}</span></p>
                    <p className="text-xs text-gray-400">{new Date(recentLog.logged_at).toLocaleString()}</p>
                </div>
            )}
        </div>
    );
};

export default ResidentHomePage;

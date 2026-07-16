import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { GateLog } from "../../interfaces/GateInterface";

const ClientActivitySkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#1c1c1c]">
      <table className="w-full whitespace-nowrap text-left text-sm text-gray-300">
        <thead className="border-b border-[#2a2a2a] bg-[#1c1c1c] text-xs font-semibold uppercase tracking-wider text-gray-400">
          <tr>
            <th className="px-6 py-4">Plate Number</th>
            <th className="px-6 py-4">Owner Name</th>
            <th className="px-6 py-4">Direction</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="border-b border-[#2a2a2a]">
              <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-zinc-800" /></td>
              <td className="px-6 py-4"><div className="h-4 w-36 rounded bg-zinc-800" /></td>
              <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-zinc-800" /></td>
              <td className="px-6 py-4"><div className="h-6 w-16 rounded bg-zinc-800" /></td>
              <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-zinc-800" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ActivityLogsPage = () => {
  const [gateLogs, setGateLogs] = useState<GateLog[]>([]);
  const [loadingGate, setLoadingGate] = useState(true);

  useEffect(() => {
    GateAccessService.loadGateLogs(1)
      .then((res) => setGateLogs(res.data.logs?.data || res.data.data || []))
      .catch(() => setGateLogs([]))
      .finally(() => setLoadingGate(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Recent Gate Activity</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Overview of the latest vehicle logs at the gate.</p>
      </div>

      {loadingGate ? (
         <ClientActivitySkeleton />
      ) : (
        <div className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#1c1c1c]">
          <table className="w-full whitespace-nowrap text-left text-sm text-gray-300">
            <thead className="border-b border-[#2a2a2a] bg-[#1c1c1c] text-xs font-semibold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">Plate Number</th>
                <th className="px-6 py-4">Owner Name</th>
                <th className="px-6 py-4">Direction</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {gateLogs.length > 0 ? gateLogs.slice(0, 10).map((log) => (
                <tr key={log.gate_log_id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4 font-mono text-gray-200">{log.plate_number}</td>
                  <td className="px-6 py-4 text-gray-300">{log.owner_name ?? "N/A"}</td>
                  <td className="px-6 py-4 text-gray-300 capitalize">{log.direction}</td>
                  <td className="px-6 py-4"><GateStatusBadge status={log.status} /></td>
                  <td className="px-6 py-4 text-[#b89e74]">{new Date(log.logged_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' })}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No recent gate activity</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const GateStatusBadge = ({ status }: { status: string }) => {
  const tone = status === "authorized"
    ? "bg-[#133021] text-[#4ade80] border border-[#1e442d]"
    : "bg-[#3f2125] text-[#f87171] border border-[#52292f]";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${tone}`}>{status}</span>;
};

export default ActivityLogsPage;

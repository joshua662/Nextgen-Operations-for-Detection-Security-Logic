import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { ActivityLog } from "../../interfaces/ActivityLogInterface";
import Spinner from "../../components/Spinner/Spinner";
import type { GateLog } from "../../interfaces/GateInterface";

const EVENT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All events" },
  { value: "admin_portal_login_success", label: "Admin login (success)" },
  { value: "admin_portal_login_failure", label: "Admin login (failure)" },
  { value: "resident_portal_login_success", label: "Resident login (success)" },
  { value: "resident_portal_login_failure", label: "Resident login (failure)" },
  { value: "logout", label: "Logout" },
];

const ActivityLogsPage = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [gateLogs, setGateLogs] = useState<GateLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGate, setLoadingGate] = useState(true);
  const [eventType, setEventType] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    GateAccessService.loadGateLogs(1)
      .then((res) => setGateLogs(res.data.logs?.data || res.data.data || []))
      .catch(() => setGateLogs([]))
      .finally(() => setLoadingGate(false));
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      GateAccessService.loadActivityLogs(1, { event_type: eventType, search })
        .then((res) => setLogs(res.data.logs.data ?? []))
        .finally(() => setLoading(false));
    }, 200);

    return () => window.clearTimeout(handle);
  }, [eventType, search]);

  // stats removed

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Activity Logs</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Review admin and resident login activity</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <input
          className="min-w-[220px] flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-[#1a1a1a] dark:text-zinc-100"
          placeholder="Search username, event, or IP..."
          value={search}
          onChange={(event) => {
            setLoading(true);
            setSearch(event.target.value);
          }}
        />
        <select
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-[#1a1a1a] dark:text-zinc-100"
          value={eventType}
          onChange={(event) => {
            setLoading(true);
            setEventType(event.target.value);
          }}
        >
          {EVENT_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Spinner size="md" /></div>
      ) : (
        <div className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#1c1c1c]">
          <table className="w-full whitespace-nowrap text-left text-sm text-gray-300">
            <thead className="border-b border-[#2a2a2a] bg-[#1c1c1c] text-xs font-semibold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Identifier</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log.activity_log_id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4 text-[#b89e74]">{new Date(log.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' })}</td>
                  <td className="px-6 py-4"><EventBadge eventType={log.event_type} /></td>
                  <td className="max-w-[220px] break-all px-6 py-4 text-xs text-gray-300">{log.username_attempted ?? "N/A"}</td>
                  <td className="px-6 py-4 text-gray-200">
                    {log.user ? `${log.user.first_name} ${log.user.last_name}` : "N/A"}
                    {log.user?.role && <span className="ml-2 text-xs capitalize text-gray-500">{log.user.role.replace('_', ' ')}</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[#b89e74]">{log.ip_address ?? "N/A"}</td>
                  <td className="max-w-xs truncate px-6 py-4 font-mono text-xs text-gray-400" title={formatContext(log.context)}>
                    {formatContext(log.context)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No activity logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Gate Activity Section Transferred from Dashboard */}
      <div className="mt-12">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Recent Gate Activity</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Overview of the latest vehicle logs at the gate.</p>
        </div>

        {loadingGate ? (
           <div className="flex justify-center p-8"><Spinner size="md" /></div>
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
    </div>
  );
};

// removed unused Stat and Head components

const EventBadge = ({ eventType }: { eventType: string }) => {
  const isFailure = eventType.includes("failure");
  const isLogout = eventType === "logout";
  const label = eventType.replaceAll("_", " ");

  let tone = "";
  if (isFailure) {
    tone = "bg-[#3f2125] text-[#f87171] border border-[#52292f]";
  } else if (isLogout) {
    tone = "bg-[#333333] text-gray-300 border border-[#4a4a4a]";
  } else {
    tone = "bg-[#133021] text-[#4ade80] border border-[#1e442d]";
  }

  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${tone}`}>{label}</span>;
};

const GateStatusBadge = ({ status }: { status: string }) => {
  const tone = status === "authorized"
    ? "bg-[#133021] text-[#4ade80] border border-[#1e442d]"
    : "bg-[#3f2125] text-[#f87171] border border-[#52292f]";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${tone}`}>{status}</span>;
};

const formatContext = (context: ActivityLog["context"]) => {
  if (!context || Object.keys(context).length === 0) return "{}";
  return JSON.stringify(context);
};

export default ActivityLogsPage;

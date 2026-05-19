import { useEffect, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { ActivityLog } from "../../interfaces/ActivityLogInterface";
import Spinner from "../../components/Spinner/Spinner";

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
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    GateAccessService.loadActivityLogs(1, { event_type: eventType, search })
      .then((res) => setLogs(res.data.logs.data ?? []))
      .finally(() => setLoading(false));
  }, [eventType, search]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Activity Logs</h1>
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          className="border rounded-lg px-3 py-2 text-sm white-bg-100 dark:border-gray-600"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          {EVENT_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] white-bg-100 dark:border-gray-600"
          placeholder="Search username, event, or IP"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <Spinner size="md" />
      ) : (
        <div className="overflow-x-auto bg-white white-bg-100 rounded-xl border dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 bg-white-100">
              <tr>
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-left">Event</th>
                <th className="p-3 text-left">Username / identifier</th>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">IP</th>
                <th className="p-3 text-left">Context</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.activity_log_id} className="border-t dark:border-gray-700">
                  <td className="p-3 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{log.event_type}</td>
                  <td className="p-3 font-mono text-xs break-all">{log.username_attempted ?? "—"}</td>
                  <td className="p-3">
                    {log.user
                      ? `${log.user.first_name} ${log.user.last_name} (${log.user.role ?? "—"})`
                      : "—"}
                  </td>
                  <td className="p-3 font-mono text-xs">{log.ip_address ?? "—"}</td>
                  <td className="p-3 text-xs max-w-xs truncate" title={JSON.stringify(log.context ?? {})}>
                    {log.context ? JSON.stringify(log.context) : "—"}
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

export default ActivityLogsPage;

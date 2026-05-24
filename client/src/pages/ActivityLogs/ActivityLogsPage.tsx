import { useEffect, useMemo, useState } from "react";
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
    const handle = window.setTimeout(() => {
      GateAccessService.loadActivityLogs(1, { event_type: eventType, search })
        .then((res) => setLogs(res.data.logs.data ?? []))
        .finally(() => setLoading(false));
    }, 200);

    return () => window.clearTimeout(handle);
  }, [eventType, search]);

  const stats = useMemo(() => {
    return logs.reduce(
      (totals, log) => {
        const isFailure = log.event_type.includes("failure");
        const isAdmin = log.event_type.includes("admin");
        const isResident = log.event_type.includes("resident");

        return {
          total: totals.total + 1,
          failed: totals.failed + (isFailure ? 1 : 0),
          admin: totals.admin + (isAdmin ? 1 : 0),
          resident: totals.resident + (isResident ? 1 : 0),
        };
      },
      { total: 0, failed: 0, admin: 0, resident: 0 },
    );
  }, [logs]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Activity Logs</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Review admin and resident login activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Visible Events" value={stats.total} />
        <Stat label="Failed Logins" value={stats.failed} tone="red" />
        <Stat label="Admin Events" value={stats.admin} />
        <Stat label="Resident Events" value={stats.resident} />
      </div>

      <div className="flex flex-wrap gap-4">
        <input
          className="min-w-[220px] flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          placeholder="Search username, event, or IP..."
          value={search}
          onChange={(event) => {
            setLoading(true);
            setSearch(event.target.value);
          }}
        />
        <select
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <Head>Time</Head>
                <Head>Event</Head>
                <Head>Identifier</Head>
                <Head>User</Head>
                <Head>IP Address</Head>
                <Head>Context</Head>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log.activity_log_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                  <td className="whitespace-nowrap px-6 py-4 text-zinc-600 dark:text-zinc-400">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4"><EventBadge eventType={log.event_type} /></td>
                  <td className="max-w-[220px] break-all px-6 py-4 font-mono text-xs text-zinc-900 dark:text-zinc-100">{log.username_attempted ?? "N/A"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-zinc-900 dark:text-zinc-100">
                    {log.user ? `${log.user.first_name} ${log.user.last_name}` : "N/A"}
                    {log.user?.role && <span className="ml-2 text-xs capitalize text-zinc-500 dark:text-zinc-400">{log.user.role}</span>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-zinc-900 dark:text-zinc-100">{log.ip_address ?? "N/A"}</td>
                  <td className="max-w-xs truncate px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400" title={formatContext(log.context)}>
                    {formatContext(log.context)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No activity logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, tone }: { label: string; value: number; tone?: "red" }) => (
  <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
    <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</h3>
    <p className={`mt-2 text-3xl font-bold ${tone === "red" ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`}>{value}</p>
  </div>
);

const Head = ({ children }: { children: string }) => (
  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{children}</th>
);

const EventBadge = ({ eventType }: { eventType: string }) => {
  const isFailure = eventType.includes("failure");
  const isLogout = eventType === "logout";
  const label = eventType.replaceAll("_", " ");

  const tone = isFailure
    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
    : isLogout
      ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${tone}`}>{label}</span>;
};

const formatContext = (context: ActivityLog["context"]) => {
  if (!context || Object.keys(context).length === 0) return "N/A";

  return JSON.stringify(context);
};

export default ActivityLogsPage;

import { useEffect, useMemo, useState } from "react";
import GateAccessService from "../../services/GateAccessService";
import type { TrafficChart } from "../../interfaces/GateInterface";
import Spinner from "../../components/Spinner/Spinner";

const ReportsPage = () => {
    const [period, setPeriod] = useState("daily");
    const [chart, setChart] = useState<TrafficChart | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        GateAccessService.trafficChart(period)
            .then((res) => setChart(res.data))
            .finally(() => setLoading(false));
    }, [period]);

    const stats = useMemo(() => {
        const authorized = chart?.authorized.reduce((sum, value) => sum + value, 0) ?? 0;
        const unauthorized = chart?.unauthorized.reduce((sum, value) => sum + value, 0) ?? 0;

        return {
            total: authorized + unauthorized,
            authorized,
            unauthorized,
        };
    }, [chart]);

    const downloadCsv = async () => {
        const res = await GateAccessService.exportCsv();
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "gate_logs.csv";
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    const downloadPdf = async () => {
        const res = await GateAccessService.exportPdf();
        const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/html" }));
        window.open(url, "_blank");
    };

    const maxVal = chart ? Math.max(...chart.authorized, ...chart.unauthorized, 1) : 1;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Reports & Analytics</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">View gate traffic statistics and export logs</p>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={downloadCsv} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">Export CSV</button>
                    <button type="button" onClick={downloadPdf} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-700">Export PDF</button>
                </div>
            </div>

            <label className="block max-w-xs">
                <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Date Range</span>
                <select value={period} onChange={(event) => { setLoading(true); setPeriod(event.target.value); }} className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                    <option value="daily">Today</option>
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                </select>
            </label>

            <div className="grid gap-4 md:grid-cols-3">
                <Stat label="Total Entries" value={stats.total} />
                <Stat label="Authorized" value={stats.authorized} tone="green" />
                <Stat label="Unauthorized" value={stats.unauthorized} tone="red" />
            </div>

            {loading ? <div className="flex justify-center p-8"><Spinner size="md" /></div> : chart && (
                <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
                    <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Daily Statistics</h3>
                    <div className="mb-6 flex h-56 items-end gap-3 overflow-x-auto rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                        {chart.labels.map((label, index) => (
                            <div key={label} className="flex min-w-[48px] flex-1 flex-col items-center">
                                <div className="flex h-40 w-full items-end justify-center gap-1">
                                    <div className="w-3 rounded-t bg-green-500" style={{ height: `${(chart.authorized[index] / maxVal) * 100}%` }} title={`Authorized: ${chart.authorized[index]}`} />
                                    <div className="w-3 rounded-t bg-red-500" style={{ height: `${(chart.unauthorized[index] / maxVal) * 100}%` }} title={`Unauthorized: ${chart.unauthorized[index]}`} />
                                </div>
                                <span className="mt-2 max-w-[64px] truncate text-xs text-zinc-500">{label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        {chart.labels.length > 0 ? chart.labels.map((label, index) => {
                            const authorized = chart.authorized[index] ?? 0;
                            const unauthorized = chart.unauthorized[index] ?? 0;

                            return (
                                <div key={label} className="flex flex-wrap items-center justify-between gap-2 rounded bg-zinc-50 p-3 dark:bg-zinc-900">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
                                    <div className="flex gap-4 text-sm">
                                        <span>Total: {authorized + unauthorized}</span>
                                        <span className="text-green-600 dark:text-green-400">Authorized: {authorized}</span>
                                        <span className="text-red-600 dark:text-red-400">Unauthorized: {unauthorized}</span>
                                    </div>
                                </div>
                            );
                        }) : <p className="py-4 text-center text-zinc-500">No data available for selected period</p>}
                    </div>
                </section>
            )}
        </div>
    );
};

const Stat = ({ label, value, tone }: { label: string; value: number; tone?: "green" | "red" }) => (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</h3>
        <p className={`mt-2 text-3xl font-bold ${tone === "green" ? "text-green-600 dark:text-green-400" : tone === "red" ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`}>{value}</p>
    </div>
);

export default ReportsPage;
